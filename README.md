# Mattis

**Mattis** is a web application for tracking player statistics and game results for the Norwegian card game Mattis. It was originally created in 2014 when I was a student at NTNU using PHP/Laravel, this application has been modernized and rewritten in TypeScript with Next.js to demonstrate modern web development practices and AI-assisted development workflows using mostly Codex CLI and Codex Cloud.

## What is Mattis?

Mattis is a popular Norwegian card game played with a standard deck of cards. This application helps players:

- **Track game rounds** with detailed scoring
- **Maintain player profiles** and statistics
- **View leaderboards** across seasons
- **Analyze performance** over time

The app provides a complete digital companion for managing your Mattis rounds, from recording individual rounds to viewing long-term player trends.

## PHP - Laravel

The project was made in PHP with the Laravel framework and is located in the [laravel](./laravel) folder.

## Typescript

In 2025, I decided to try to rewrite the project in Typescript with AI assistance by using [Spec Kit](https://github.com/github/spec-kit) and Codex.

## Tooling

### Pre-commit hooks

This repository uses [pre-commit](https://pre-commit.com/) to run formatting, linting, and infrastructure checks locally before you push changes.

1. Make sure the TypeScript dependencies are installed with `npm install` and Terraform is available on your machine when you work on infrastructure code.
2. Install pre-commit (for example with `brew install pre-commit`).
3. Enable the hooks with `pre-commit install`.

You can run all hooks on demand with `pre-commit run -a`.

### OpenAPI-driven client

The TypeScript app consumes the API contract defined in [`openapi.yaml`](./openapi.yaml).

- Run `npm run openapi:generate` whenever the contract changes to refresh the generated typings in [`src/lib/api/generated.ts`](./src/lib/api/generated.ts).
- Use the shared `apiClient` from [`src/lib/api/client.ts`](./src/lib/api/client.ts) for HTTP requests. It wraps [`openapi-fetch`](https://github.com/drwpow/openapi-fetch) so every `GET`, `POST`, `PUT`, etc. call is type-safe out of the box.
- Prefer deriving API-facing TypeScript types from the generated OpenAPI components (see [`src/lib/api/schemas.ts`](./src/lib/api/schemas.ts)) instead of `z.infer`, so we do not have to manually synchronize type aliases with the schema.

## CI/CD & Infrastructure

### GitHub Actions Pipeline

The project uses a comprehensive CI/CD pipeline defined in [`.github/workflows/ci-cd-pipeline.yml`](./.github/workflows/ci-cd-pipeline.yml) that runs on pushes to `main` and all pull requests.

**Pipeline Jobs:**

- **Code Quality** - Runs in parallel:
  - TypeScript type checking (`npm run tsc`)
  - Linting with Biome (`npm run lint`)
- **Unit Tests** - Executes the Vitest test suite with coverage reporting
- **Infrastructure Checks** - Validates Terraform configuration:
  - Formatting checks (`terraform fmt`)
  - Configuration validation (`terraform validate`)
  - TFLint for best practices
- **End-to-End Tests** - Runs Playwright tests against a PostgreSQL service container
- **Build** - Packages the Next.js app as an AWS Lambda function and uploads the artifact
- **Plan** (PRs only) - Generates a Terraform plan using the built artifact
- **Deploy** (main branch only) - Applies Terraform changes and runs database migrations in production

**Key Features:**

- Concurrency control to cancel in-progress runs on new pushes
- Dependency review for pull requests
- Coverage reports with Vitest
- Artifact retention for Lambda builds (3 days) and test reports (30 days)
- Environment protection for production deployments

### Infrastructure as Code (Terraform)

The [`iac/`](./iac/) directory contains Terraform configuration for provisioning the production stack on AWS and Neon.

**What gets deployed:**

- **Database**: Neon PostgreSQL project in `aws-eu-central-1` with 7 days PITR retention
- **Compute**: AWS Lambda function (ZIP runtime) in `eu-north-1` running Next.js standalone server via Lambda Web Adapter
- **CDN**: CloudFront distribution with Origin Access Control (OAC) secured to the Lambda Function URL
- **DNS**: Cloudflare DNS records and ACM certificate for `mattis.aasan.dev`

See [`iac/README.md`](./iac/README.md) for detailed infrastructure documentation, required variables, and deployment instructions.

## Contributing

We welcome contributions to Mattis! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### Getting Started

1. **Fork the repository** and clone your fork locally
2. **Install dependencies**: `npm install`
3. **Set up your environment**: Copy `.env.example` to `.env` and configure as needed
4. **Start local infrastructure**: Run `npm run docker:compose:up` to start PostgreSQL and other required services (or `npm run docker:compose:reset` to reset the database). This also runs database migrations automatically.
5. **Install pre-commit hooks**: `pre-commit install` (see [Tooling](#tooling) section above)
6. **Start the development server**: `npm run dev`

### Development Workflow

1. **Create a feature branch** from `main`:

   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following our coding standards:

   - Follow the TypeScript and React guidelines in the `/instructions` directory
   - Write tests for new features
   - Update the OpenAPI spec if you modify API contracts

3. **Test your changes**:

   ```bash
   npm run lint          # Run linting
   npm run tsc           # Type check
   npm test              # Run unit/integration tests
   npm run test:e2e      # Run end-to-end tests (optional)
   ```

4. **Commit your changes** using [Conventional Commits](https://www.conventionalcommits.org/):

   ```bash
   git commit -m "feat: add player statistics export"
   git commit -m "fix: resolve leaderboard sorting issue"
   git commit -m "docs: update API documentation"
   ```

5. **Push to your fork** and **create a Pull Request**

### Code Quality Standards

- **TypeScript**: Use strict mode, avoid `any`, prefer type-only imports
- **Testing**: Maintain 80% code coverage threshold (enforced by Vitest)
- **Formatting**: Code is auto-formatted with Biome on commit
- **Accessibility**: Follow ARIA best practices and semantic HTML
- **Security**: Validate inputs, sanitize outputs, never commit secrets

### Pull Request Guidelines

- **Title**: Use conventional commit format (e.g., `feat: add feature X`)
- **Description**: Clearly describe what changes you made and why
- **Tests**: Include tests that verify your changes work correctly
- **Documentation**: Update relevant docs if behavior changes
- **Small PRs**: Keep changes focused and reviewable (ideally < 400 lines)

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](../../issues) with:

- **Clear title** describing the problem or feature
- **Steps to reproduce** (for bugs)
- **Expected vs actual behavior** (for bugs)
- **Screenshots or logs** if applicable
- **Environment details** (browser, OS, Node version)

### Questions?

If you have questions about contributing, feel free to open a discussion or reach out to the maintainers.

## License

This project is open source and available for educational and personal use, but not for commercial purposes.
