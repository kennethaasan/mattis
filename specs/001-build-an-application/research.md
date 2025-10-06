# Phase 0: Research & Technical Decisions

**Status**: Completed

This document outlines the technology stack and architectural decisions for the Mattis Stats application rewrite, based on the feature specification and user-provided technical requirements.

---

### 1. Frontend Framework

- **Decision**: Next.js (App Router) with React 19+
- **Rationale**: The user explicitly requested Next.js. The App Router is the current standard, enabling a powerful combination of Server Components for data fetching and static rendering, and Client Components for interactivity. This aligns with performance goals by minimizing client-side JavaScript.
- **Alternatives Considered**:
  - **Vite + React**: A simpler, faster build tool, but lacks the integrated server-side rendering, routing, and data-fetching patterns that Next.js provides out-of-the-box, which are beneficial for this project's structure.

### 2. UI Components & Styling

- **Decision**: Tailwind CSS with Shadcn UI
- **Rationale**: This combination was explicitly requested. Tailwind CSS provides a utility-first approach for rapid, consistent styling. Shadcn UI offers a set of accessible, unstyled components that can be easily customized and integrated into the project, accelerating development while maintaining a unique design.
- **Alternatives Considered**:
  - **Material UI (MUI) / Chakra UI**: These are component libraries with pre-defined styles. While powerful, they are less flexible than the Shadcn/Tailwind approach and can introduce more stylistic overhead than necessary for this project.

### 3. Backend & Hosting

- **Decision**: AWS Serverless (Next.js on AWS Lambda, Aurora Serverless for Database)
- **Rationale**: The user specified an AWS serverless architecture.
  - **Compute**: Deploying the Next.js application to AWS Lambda (e.g., via SST or OpenNext) provides a cost-effective, auto-scaling backend without managing servers. API routes within Next.js will serve as the backend endpoints.
  - **Database**: Amazon Aurora Serverless (PostgreSQL compatible) is a managed, auto-scaling relational database that aligns with the serverless model. It handles unpredictable workloads well and reduces operational overhead. Drizzle ORM will be used for database access as per the constitution.
- **Alternatives Considered**:
  - **AWS EC2 / Fargate**: Requires more manual configuration and management compared to the serverless approach. Not aligned with the user's request.
  - **DynamoDB**: A NoSQL option. While highly scalable, the relational nature of the data (Players, Rounds, FettMattis records) makes a SQL database like Aurora a more natural fit.

### 4. Infrastructure as Code (IaC)

- **Decision**: AWS CDK (Cloud Development Kit) in TypeScript
- **Rationale**: Explicitly requested by the user. Using TypeScript for IaC allows for a consistent language across the entire stack (frontend, backend, infrastructure), improving developer experience and enabling code sharing and type safety.
- **Alternatives Considered**:
  - **Terraform**: A powerful, cloud-agnostic IaC tool. However, CDK provides a more integrated experience for TypeScript developers.
  - **AWS SAM / CloudFormation**: Lower-level than CDK. CDK compiles down to CloudFormation but offers a much better developer experience with high-level constructs.

### 5. API Specification & Validation

- **Decision**: OpenAPI 3.1.0 with Spectral Linting
- **Rationale**: The user requested an OpenAPI spec. The latest version is 3.1.0, but 3.0.3 or 3.0.x is more common and stable. We will use 3.0.3 for broader compatibility. Spectral is a powerful, configurable linter for API specifications. Using established, open-source rulesets (e.g., from Spectral's own recommendations or OpenAPI Initiative) will enforce best practices for API design.
- **Error Handling**: Adherence to RFC 9457 for problem details ensures standardized, machine-readable error responses.

### 6. Testing Frameworks

- **Decision**: Vitest for Unit/Integration, Playwright for End-to-End (E2E)
- **Rationale**: This is mandated by the project's `constitution.md`.
  - **Vitest**: A modern, fast test runner that is compatible with the TypeScript/ESM-based project.
  - **Playwright**: A robust E2E testing framework that allows for reliable testing of user interactions and accessibility requirements outlined in the spec.

All technical decisions are aligned with the user's request and the project's constitutional requirements. No outstanding clarifications remain.
