import { existsSync } from 'node:fs';
import { join as joinPath } from 'node:path';

import {
  Annotations,
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  Tags,
} from 'aws-cdk-lib';
import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import {
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from 'aws-cdk-lib/aws-ec2';
import {
  Architecture,
  Code,
  Function as LambdaFunction,
  FunctionUrlAuthType,
  InvokeMode,
  Runtime,
} from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import {
  AuroraCapacityUnit,
  AuroraPostgresEngineVersion,
  Credentials,
  DatabaseClusterEngine,
  ServerlessCluster,
} from 'aws-cdk-lib/aws-rds';
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
} from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';

interface MattisStackProps extends StackProps {
  readonly stage?: string;
}

const resolveStage = (
  scope: Construct,
  explicitStage?: string,
): { name: string; isProduction: boolean } => {
  const contextStage = scope.node.tryGetContext('stage') as string | undefined;
  const environmentStage = process.env.DEPLOY_ENV;
  const stage =
    explicitStage ?? contextStage ?? environmentStage ?? 'dev';
  return {
    name: stage,
    isProduction: stage === 'prod' || stage === 'production',
  };
};

export class MattisStack extends Stack {
  constructor(scope: Construct, id: string, props: MattisStackProps = {}) {
    super(scope, id, props);

    const { name: stage, isProduction } = resolveStage(this, props.stage);
    Tags.of(this).add('app', 'mattis');
    Tags.of(this).add('stage', stage);

    const projectRoot = joinPath(__dirname, '..', '..');
    const openNextRoot = joinPath(projectRoot, '.open-next');
    const serverFunctionDir = joinPath(openNextRoot, 'server-function');
    const imageFunctionDir = joinPath(
      openNextRoot,
      'image-optimization-function',
    );
    const assetsDir = joinPath(openNextRoot, 'assets');

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

    const vpc = new Vpc(this, 'MattisVpc', {
      natGateways: isProduction ? 1 : 0,
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: 'private-egress',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          name: 'isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    const lambdaSecurityGroup = new SecurityGroup(
      this,
      'AppLambdaSecurityGroup',
      {
        vpc,
        allowAllOutbound: true,
        description: 'Security group for the Next.js Lambda handlers',
      },
    );

    const databaseSecurityGroup = new SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        allowAllOutbound: false,
        description: 'Security group for the Aurora cluster',
      },
    );

    databaseSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      Port.tcp(5432),
      'Allow application Lambdas to reach the database',
    );
    databaseSecurityGroup.addIngressRule(
      Peer.ipv4(vpc.vpcCidrBlock),
      Port.tcp(5432),
      'Allow VPC resources to reach the database on the default port',
    );

    const databaseCluster = new ServerlessCluster(this, 'MattisDatabase', {
      vpc,
      engine: DatabaseClusterEngine.auroraPostgres({
        version: AuroraPostgresEngineVersion.VER_14_6,
      }),
      defaultDatabaseName: 'mattis',
      scaling: {
        autoPause: isProduction ? undefined : Duration.minutes(30),
        maxCapacity: AuroraCapacityUnit.ACU_32,
        minCapacity: AuroraCapacityUnit.ACU_2,
      },
      credentials: Credentials.fromGeneratedSecret('mattis_app'),
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [databaseSecurityGroup],
      removalPolicy: isProduction
        ? RemovalPolicy.RETAIN
        : RemovalPolicy.DESTROY,
    });

    const staticBucket = new Bucket(this, 'MattisStaticAssets', {
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
      new BucketDeployment(this, 'StaticAssetDeployment', {
        destinationBucket: staticBucket,
        sources: [Source.asset(assetsDir)],
        retainOnDelete: isProduction,
      });
    }

    const serverFunction = new LambdaFunction(this, 'NextServerFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: Code.fromAsset(serverFunctionDir),
      memorySize: 1024,
      timeout: Duration.seconds(30),
      architecture: Architecture.ARM_64,
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      logRetention: RetentionDays.ONE_MONTH,
      environment: {
        NODE_ENV: 'production',
        STAGE: stage,
        DATABASE_NAME: 'mattis',
        DATABASE_SECRET_ARN: databaseCluster.secret?.secretArn ?? '',
        STATIC_ASSET_BUCKET_NAME: staticBucket.bucketName,
        NEXT_SHARP_PATH: '/opt/nodejs/node_modules/sharp',
        NEXT_TELEMETRY_DISABLED: '1',
      },
    });

    if (databaseCluster.secret === undefined) {
      Annotations.of(this).addError(
        'Aurora cluster did not expose a secret. The Lambda functions cannot authenticate.',
      );
    } else {
      databaseCluster.secret.grantRead(serverFunction);
    }

    staticBucket.grantRead(serverFunction);

    const serverFunctionUrl = serverFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      invokeMode: InvokeMode.BUFFERED,
    });

    const httpApi = new HttpApi(this, 'MattisHttpApi', {
      apiName: `mattis-${stage}`,
    });

    const apiIntegration = new HttpLambdaIntegration(
      'NextServerIntegration',
      serverFunction,
    );

    httpApi.addRoutes({
      path: '/',
      methods: [HttpMethod.ANY],
      integration: apiIntegration,
    });
    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: apiIntegration,
    });

    serverFunction.addEnvironment('HTTP_API_URL', httpApi.apiEndpoint);
    serverFunction.addEnvironment('FUNCTION_URL', serverFunctionUrl.url);

    if (existsSync(imageFunctionDir)) {
      const imageLambda = new LambdaFunction(this, 'NextImageFunction', {
        runtime: Runtime.NODEJS_20_X,
        handler: 'index.handler',
        code: Code.fromAsset(imageFunctionDir),
        architecture: Architecture.ARM_64,
        memorySize: 512,
        timeout: Duration.seconds(10),
        vpc,
        vpcSubnets: {
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        logRetention: RetentionDays.ONE_MONTH,
        environment: {
          NODE_ENV: 'production',
          STAGE: stage,
          STATIC_ASSET_BUCKET_NAME: staticBucket.bucketName,
        },
      });

      staticBucket.grantRead(imageLambda);

      const imageIntegration = new HttpLambdaIntegration(
        'NextImageIntegration',
        imageLambda,
      );

      httpApi.addRoutes({
        path: '/_next/image',
        methods: [HttpMethod.GET],
        integration: imageIntegration,
      });
    }

    new CfnOutput(this, 'ApiEndpoint', {
      value: httpApi.apiEndpoint,
    });
    new CfnOutput(this, 'FunctionUrl', {
      value: serverFunctionUrl.url,
    });
    new CfnOutput(this, 'StaticAssetBucketName', {
      value: staticBucket.bucketName,
    });
    if (databaseCluster.secret !== undefined) {
      new CfnOutput(this, 'DatabaseSecretArn', {
        value: databaseCluster.secret.secretArn,
      });
    }
  }
}
