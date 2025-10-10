First, ensure that linting, testing, and prettier are all passing.

Then, please implement the following features in the project:

1. please make sure we use the AWS free tier + the first year free tier features in the infra CDK code. I want it to be as cheap as possible or free
2. If an login UI is needed, please use better-auth with drizzle. Also, please make sure we use the AWS free tier + the first year free tier features in the infra CDK code. I want it to be as cheap as possible or free
3. make sure we have max number of days of backup that is free within the AWS free tier. Ensure that CORS are set up correctly. We want to accept both mattis.aasan.dev and mattis.vanvikil.no domains
4. make sure we check npm run build in the infra folder in github actions in PRs
5. Use BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD, and BASIC_AUTH_USER_ID to create a user in the src/scripts/seed.ts and src/scripts/migrate-from-mysql.ts with a shared func
6. Update any clients (including the React forms) that call write endpoints to send the appropriate Authorization: Basic … header, otherwise they will now see 401s. Create a login for the frontend. Redirect the user to the login if they try to go to /rounds
7. After adjusting client auth, run the full pipeline (lint/tests/prettier) and npm --prefix infra run build to verify the CDK stack synthesizes with the new RDS settings.
8. add support for editing users active mode or not. Also make sure we don't show inactive players when creating a new round or fettmattis. Also make sure that when a user wants to create a new round, the players from the most recent round shows up first to make it easier to create new rounds. Please test all of these
   features
