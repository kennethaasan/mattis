# Mattis

This project was made when I was a student at NTNU in 2014. It's a simple web application that allows us to track statistics for the card game Mattis.

## PHP - Laravel

The project was made in PHP with the Laravel framework and is located in the [laravel](./laravel) folder.

## Typescript

In 2025, I decided to try to rewrite the project in Typescript with AI assistance by using [Spec Kit](https://github.com/github/spec-kit).

## Tooling

### Pre-commit hooks

This repository uses [pre-commit](https://pre-commit.com/) to run formatting, linting, and infrastructure checks locally before you push changes.

1. Make sure the TypeScript dependencies are installed with `npm install` and Terraform is available on your machine when you work on infrastructure code.
2. Install pre-commit (for example with `brew install pre-commit`).
3. Enable the hooks with `pre-commit install`.

You can run all hooks on demand with `pre-commit run -a`.

### OpenAPI-driven client

The TypeScript app consumes the API contract defined in [`openapi.yaml`](./openapi.yaml).

* Run `npm run openapi:generate` whenever the contract changes to refresh the generated typings in [`src/lib/api/generated.ts`](./src/lib/api/generated.ts).
* Use the shared `apiClient` from [`src/lib/api/client.ts`](./src/lib/api/client.ts) for HTTP requests. It wraps [`openapi-fetch`](https://github.com/drwpow/openapi-fetch) so every `GET`, `POST`, `PUT`, etc. call is type-safe out of the box.
* Prefer deriving API-facing TypeScript types from the generated OpenAPI components (see [`src/lib/api/schemas.ts`](./src/lib/api/schemas.ts)) instead of `z.infer`, so we do not have to manually synchronize type aliases with the schema.
