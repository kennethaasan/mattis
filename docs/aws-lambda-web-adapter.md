# AWS Lambda Web Adapter authorization headers

Historically we configured the Lambda Web Adapter's `AWS_LWA_AUTHORIZATION_SOURCE`
to work around the IAM-only `Authorization` header that Lambda Function URLs use
when SigV4 signing is enabled. POST requests signed by CloudFront started failing
with `InvalidSignatureException`, so we temporarily exposed the function URL with
`auth_type = NONE` and relied on the Lambda resource policy (restricted to
CloudFront) for protection. That change let the adapter receive the viewer
`Authorization` header directly and removed the need for a remapped header.

AWS now enforces IAM authorization for Function URLs that are fronted by
CloudFront origin access control, so we reverted to `auth_type = AWS_IAM` and
restored `AWS_LWA_AUTHORIZATION_SOURCE` in `iac/main.tf` to map the
`X-Amzn-Original-Authorization` header that CloudFront preserves after signing
the origin request. The resource policy in `iac/main.tf:170-185` still limits
invocation to our distribution (principal `cloudfront.amazonaws.com` scoped to
the distribution ARN) and we continue to grant the companion
`lambda:InvokeFunction` permission that AWS requires for new Function URLs.
This keeps us aligned with AWS' Function URL guidance to pair IAM auth with
least-privilege resource policies
([docs](https://docs.aws.amazon.com/lambda/latest/dg/urls-auth.html#urls-auth-type-iam-policy)).

If we need an additional safeguard in the future we can ask CloudFront to inject
a shared secret header and verify it before processing the request, but it is
optional because the resource policy already enforces the minimum-privilege
boundary that AWS calls out as the best practice.
