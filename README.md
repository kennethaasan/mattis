# Mattis

This project was made when I was a student at NTNU in 2014. It's a simple web application that allows us to track statistics for the card game Mattis.

## PHP - Laravel

The project was made in PHP with the Laravel framework and is located in the [laravel](./laravel) folder.

## Typescript

In 2025, I decided to try to rewrite the project in Typescript with AI assistance by using [Spec Kit](https://github.com/github/spec-kit).

## Tooling

### Pre-commit hooks

This repository uses [pre-commit](https://pre-commit.com/) to run formatting, linting, and infrastructure checks locally before you push changes.

1. Make sure the JavaScript dependencies are installed with `npm install` and Terraform is available on your machine when you work on infrastructure code.
2. Install pre-commit (for example with `pipx install pre-commit` or `python -m pip install pre-commit`).
3. Enable the hooks with `pre-commit install`.

You can run all hooks on demand with `pre-commit run --all-files`. The optional Vitest hook is configured for manual execution via `pre-commit run vitest` when you want to run the unit test suite through pre-commit.
