# Phase 1: Quickstart Guide

**Status**: Completed

This guide provides instructions for setting up and running the Mattis Stats application locally for development and testing.

---

### Prerequisites

- **Node.js**: Version 22.x (as specified in the constitution). Use a version manager like `nvm` (`nvm use`).
- **Docker**: For running a local PostgreSQL database.
- **AWS CLI**: Configured with credentials for deploying the IaC stack.

### 1. Setup Local Environment

1.  **Clone the Repository**:

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2.  **Install Dependencies**:

    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Copy the example environment file and fill in the details for your local database.

    ```bash
    cp .env.example .env.local
    ```

    **`.env.local`**:

    ```
    DATABASE_URL="postgresql://user:password@localhost:5432/mattis_db"
    # Add other environment variables as needed
    ```

4.  **Start Local Database**:
    Run a PostgreSQL instance using Docker.
    ```bash
    docker run --name mattis-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_USER=user -e POSTGRES_DB=mattis_db -p 5432:5432 -d postgres
    ```

### 2. Database Migrations

Run the Drizzle ORM migrations to set up the database schema.

```bash
npm run db:migrate
```

### 3. Run the Application

Start the Next.js development server.

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### 4. Running Tests

- **Unit & Integration Tests**:

  ```bash
  npm test
  ```

- **E2E Tests**:
  ```bash
  npx playwright test
  ```

### 5. Deploying the IaC Stack (AWS CDK)

To deploy the serverless infrastructure to your AWS account:

1.  **Bootstrap CDK** (if it's your first time using CDK in this region/account):

    ```bash
    npx cdk bootstrap
    ```

2.  **Deploy the Stack**:
    ```bash
    npx cdk deploy
    ```

### Acceptance Criteria Validation

To validate the acceptance criteria from the feature specification:

1.  **Create Players**: Use the UI or send `POST` requests to `/api/players` with a `display_name`.
2.  **Record a Round**: Send a `POST` request to `/api/rounds` with `participant_ids` and a `loser_id`.
3.  **Grant a FettMattis**: Send a `POST` request to `/api/fettmattis` with a `player_id` and an optional `round_id`.
4.  **View Leaderboards**: Access the leaderboard pages in the application to verify that stats are calculated and displayed correctly.
5.  **Test 24h Window**: Record a round/FettMattis and attempt to edit/delete it immediately. Wait 24 hours (or manually adjust the `created_at` timestamp in the database for testing) and confirm the action is forbidden.
