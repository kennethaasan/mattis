# AWS Lambda Web Adapter authorization headers

The Lambda Web Adapter reserves the `Authorization` header when the function URL
uses IAM authentication. Upstream recommends forwarding the viewer credential in
an alternate header and remapping it with the
`AWS_LWA_AUTHORIZATION_SOURCE` environment variable so application code can
continue to read `Authorization` normally. See the [Lambda Web Adapter
README](https://github.com/awslabs/aws-lambda-web-adapter?tab=readme-ov-file#environment-variables)
for the full description.

Our infrastructure sets `AWS_LWA_AUTHORIZATION_SOURCE` to
`x-forwarded-authorization` so the adapter promotes that header to
`Authorization` before forwarding the request to Next.js. Clients send both
headers to keep local development behaviour unchanged while satisfying the AWS
Function URL requirement in production.
