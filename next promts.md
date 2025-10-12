# Next promts

## Infrastructure as Code

1. Remove the existing infra CDK code
2. Create a new iac folder with Terraform
3. Create a postgres db in Neon using the free tier. Ensure that we use as many backup days as possible within the free tier.
4. Set up AWS lambda to run the Next.js app. Use other AWS free tier services as needed (e.g., CloudFront, API Gateway, S3, etc.)
5. Use mattis.aasan.dev as a domain for this app. You can assume that the aasan.dev hosted zone already exists in the same AWS account.
6. Change the .github/workflows/deploy.yml accordingly. We need to run the database migrate script as part of the deploy process. We can do that post deployment, but it needs to be part of the deploy workflow.

While doing this, make sure we use as much free tier of Neon and AWS as possible. The goal is to have a very cheap or free setup.

Use the closest zones to Norway as possible.

## Authentication and Authorization

1. Please use better-auth with drizzle for authentication.
2. Ensure that CORS are set up correctly. We want to accept both mattis.aasan.dev and mattis.vanvikil.no domains
3. Use BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD, and BASIC_AUTH_USER_ID to create a user in the src/scripts/seed.ts and src/scripts/migrate-from-mysql.ts with a shared func
4. Update any clients (including the React forms) that call write endpoints to send the appropriate header, otherwise they will now see forbidden responses. Create a login for the frontend. Redirect the user to the login if they try to go to /rounds
5. After adjusting client auth, run the full pipeline (lint/tests/prettier) and ensure everything is passing.

Please try to test all of these features. When done, please ensure that linting, testing, and prettier are all passing again.

## Editing users

1. add support for editing users active mode or not.
2. make sure we don't show inactive players when creating a new round or fettmattis
3. make sure that when a user wants to create a new round, the players from the most recent round shows up first to make it easier to create new rounds.

Please test all of these features. When done, please ensure that linting, testing, and prettier are all passing again.

## Use Drizzle models everywhere

1. Make sure we use the Drizzle models everywhere. I can see that some places like src/scripts/seed.ts are using manual SQL queries. Please change those to use Drizzle models instead.
