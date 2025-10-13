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
