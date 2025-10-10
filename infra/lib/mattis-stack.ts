import { existsSync } from "node:fs";
import { join as joinPath } from "node:path";

import {
  Annotations,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  Tags,
} from "aws-cdk-lib";
import type { StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";
import { CorsHttpMethod, HttpApi } from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import {
  GatewayVpcEndpointAwsService,
  InstanceClass,
  InstanceSize,
  InstanceType,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import {
  Architecture,
  Code,
  Function as LambdaFunction,
  FunctionUrlAuthType,
  InvokeMode,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import {
  Credentials,
  DatabaseInstance,
  DatabaseInstanceEngine,
  PostgresEngineVersion,
  StorageType,
} from "aws-cdk-lib/aws-rds";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
} from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";

interface MattisStackProps extends StackProps {
  readonly stage?: string;
}

const resolveStage = (
  scope: Construct,
  explicitStage?: string,
): { name: string; isProduction: boolean } => {
  const contextStage = scope.node.tryGetContext("stage") as string | undefined;
  const environmentStage = process.env.DEPLOY_ENV;
  const stage = explicitStage ?? contextStage ?? environmentStage ?? "dev";
  return {
    name: stage,
    isProduction: stage === "prod" || stage === "production",
  };
};

export class MattisStack extends Stack {
  constructor(scope: Construct, id: string, props: MattisStackProps = {}) {
    super(scope, id, props);

    const { name: stage, isProduction } = resolveStage(this, props.stage);
    Tags.of(this).add("app", "mattis");
    Tags.of(this).add("stage", stage);

    const projectRoot = joinPath(__dirname, "..", "..");
    const openNextRoot = joinPath(projectRoot, ".open-next");
    const serverFunctionDir = joinPath(openNextRoot, "server-function");
    const imageFunctionDir = joinPath(
      openNextRoot,
      "image-optimization-function",
    );
    const assetsDir = joinPath(openNextRoot, "assets");

    if (!existsSync(serverFunctionDir)) {
      Annotations.of(this).addError(
        `OpenNext build artifact missing: ${serverFunctionDir}. Run \`npm run build\` followed by \`npx open-next build\` before synthesising.`,
      );
    }

    if (!existsSync(assetsDir)) {
      Annotations.of(this).addWarning(
        `Static asset directory not found at ${assetsDir}. Static files will not be deployed until OpenNext builds assets.`,
      );
    }

    if (!existsSync(imageFunctionDir)) {
      Annotations.of(this).addWarning(
        `Image optimisation function not found at ${imageFunctionDir}. Image optimisation requests will fail until OpenNext builds the handler.`,
      );
    }

    const vpc = new Vpc(this, "MattisVpc", {
      natGateways: 0,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: "public",
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: "isolated",
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    vpc.addGatewayEndpoint("S3GatewayEndpoint", {
      service: GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnets: vpc.isolatedSubnets,
        },
      ],
    });

    const lambdaSecurityGroup = new SecurityGroup(
      this,
      "AppLambdaSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
        description: "Security group for the Next.js Lambda handlers",
      },
    );

    const databaseSecurityGroup = new SecurityGroup(
      this,
      "DatabaseSecurityGroup",
      {
        vpc,
        allowAllOutbound: false,
        description: "Security group for the Aurora cluster",
      },
    );

    databaseSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      Port.tcp(5432),
      "Allow application Lambdas to reach the database",
    );
    const databaseInstance = new DatabaseInstance(this, "MattisDatabase", {
      vpc,
      engine: DatabaseInstanceEngine.postgres({
        version: PostgresEngineVersion.VER_17_6,
      }),
      databaseName: "mattis",
      credentials: Credentials.fromGeneratedSecret("mattis_app"),
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [databaseSecurityGroup],
      removalPolicy: isProduction
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      publiclyAccessible: false,
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageEncrypted: true,
      storageType: StorageType.GP2,
      deletionProtection: isProduction,
      backupRetention: Duration.days(7),
      autoMinorVersionUpgrade: true,
      multiAz: false,
    });

    const staticBucket = new Bucket(this, "MattisStaticAssets", {
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: isProduction
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProduction,
    });

    if (existsSync(assetsDir)) {
      new BucketDeployment(this, "StaticAssetDeployment", {
        destinationBucket: staticBucket,
        sources: [Source.asset(assetsDir)],
        retainOnDelete: isProduction,
      });
    }

    const serverFunction = new LambdaFunction(this, "NextServerFunction", {
      runtime: Runtime.NODEJS_20_X,
      handler: "index.handler",
      code: Code.fromAsset(serverFunctionDir),
      memorySize: 512,
      timeout: Duration.seconds(30),
      architecture: Architecture.ARM_64,
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [lambdaSecurityGroup],
      logRetention: RetentionDays.ONE_WEEK,
      environment: {
        NODE_ENV: "production",
        STAGE: stage,
        DATABASE_NAME: "mattis",
        DATABASE_SECRET_ARN: databaseInstance.secret?.secretArn ?? "",
        STATIC_ASSET_BUCKET_NAME: staticBucket.bucketName,
        NEXT_SHARP_PATH: "/opt/nodejs/node_modules/sharp",
        NEXT_TELEMETRY_DISABLED: "1",
      },
    });

    if (databaseInstance.secret === undefined) {
      Annotations.of(this).addError(
        "Database instance did not expose a secret. The Lambda functions cannot authenticate.",
      );
    } else {
      databaseInstance.secret.grantRead(serverFunction);
    }

    staticBucket.grantRead(serverFunction);

    const corsAllowedOrigins = [
      "https://mattis.aasan.dev",
      "https://mattis.vanvikil.no",
    ];

    const serverFunctionUrl = serverFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      invokeMode: InvokeMode.BUFFERED,
      cors: {
        allowedOrigins: corsAllowedOrigins,
        allowedHeaders: ["authorization", "content-type"],
        allowCredentials: true,
        allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      },
    });

    const httpApi = new HttpApi(this, "MattisHttpApi", {
      apiName: `mattis-${stage}`,
      corsPreflight: {
        allowOrigins: corsAllowedOrigins,
        allowHeaders: ["authorization", "content-type"],
        allowCredentials: true,
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
          CorsHttpMethod.OPTIONS,
        ],
      },
    });

    const apiIntegration = new HttpLambdaIntegration(
      "NextServerIntegration",
      serverFunction,
    );

    httpApi.addRoutes({
      path: "/",
      methods: [HttpMethod.ANY],
      integration: apiIntegration,
    });
    httpApi.addRoutes({
      path: "/{proxy+}",
      methods: [HttpMethod.ANY],
      integration: apiIntegration,
    });

    serverFunction.addEnvironment("HTTP_API_URL", httpApi.apiEndpoint);
    serverFunction.addEnvironment("FUNCTION_URL", serverFunctionUrl.url);

    if (existsSync(imageFunctionDir)) {
      const imageLambda = new LambdaFunction(this, "NextImageFunction", {
        runtime: Runtime.NODEJS_20_X,
        handler: "index.handler",
        code: Code.fromAsset(imageFunctionDir),
        architecture: Architecture.ARM_64,
        memorySize: 256,
        timeout: Duration.seconds(10),
        vpc,
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [lambdaSecurityGroup],
        logRetention: RetentionDays.ONE_WEEK,
        environment: {
          NODE_ENV: "production",
          STAGE: stage,
          STATIC_ASSET_BUCKET_NAME: staticBucket.bucketName,
        },
      });

      staticBucket.grantRead(imageLambda);

      const imageIntegration = new HttpLambdaIntegration(
        "NextImageIntegration",
        imageLambda,
      );

      httpApi.addRoutes({
        path: "/_next/image",
        methods: [HttpMethod.GET],
        integration: imageIntegration,
      });
    }

    new CfnOutput(this, "ApiEndpoint", {
      value: httpApi.apiEndpoint,
    });
    new CfnOutput(this, "FunctionUrl", {
      value: serverFunctionUrl.url,
    });
    new CfnOutput(this, "StaticAssetBucketName", {
      value: staticBucket.bucketName,
    });
    if (databaseInstance.secret !== undefined) {
      new CfnOutput(this, "DatabaseSecretArn", {
        value: databaseInstance.secret.secretArn,
      });
    }
  }
}
