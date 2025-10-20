# AWS Lambda Web Adapter authorization headers

Historically we configured the Lambda Web Adapter's `AWS_LWA_AUTHORIZATION_SOURCE`
to work around the IAM-only `Authorization` header that Lambda Function URLs use
when SigV4 signing is enabled. POST requests signed by CloudFront started failing
with `InvalidSignatureException`, so we now expose the function URL with
`auth_type = NONE` and rely on the Lambda resource policy (restricted to
CloudFront) for protection. With IAM out of the path the adapter receives the
viewer `Authorization` header directly and no longer needs a remapped header.

This setup follows AWS' Function URL guidance that recommends locking down
`auth_type = NONE` URLs with a resource policy
([docs](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html#urls-auth-type-none-policy)).
The policy we attach in `iac/main.tf:166-173` allows only our CloudFront
distribution (principal `cloudfront.amazonaws.com` scoped to the distribution
ARN) to invoke the URL, so the Lambda endpoint is still unreachable from the
public internet. Because AWS now requires both `lambda:InvokeFunctionUrl` and
`lambda:InvokeFunction` permissions for new Function URLs, we grant CloudFront
the second action in `iac/main.tf:175-183`. Even without the explicit
`lambda:InvokedViaFunctionUrl` condition (Terraform no longer supports
expressing it), the statement remains limited to this distribution through the
`source_arn`.

If we need an additional safeguard in the future we can ask CloudFront to inject
a shared secret header and verify it before processing the request, but it is
optional because the resource policy already enforces the minimum-privilege
boundary that AWS calls out as the best practice.
