import { describe, expect, test } from "vitest";

import { problemToError, resolveProblemDetail } from "@/lib/api/client";

describe("resolveProblemDetail", () => {
  test("returns undefined for undefined problem", () => {
    expect(resolveProblemDetail(undefined)).toBeUndefined();
  });

  test("returns undefined when detail is missing", () => {
    const problem = { type: "about:blank", title: "Error", status: 400 };
    expect(resolveProblemDetail(problem)).toBeUndefined();
  });

  test("returns undefined when detail is not a string", () => {
    const problem = {
      type: "about:blank",
      title: "Error",
      status: 400,
      detail: 123 as never,
    };
    expect(resolveProblemDetail(problem)).toBeUndefined();
  });

  test("returns undefined for empty string detail", () => {
    const problem = {
      type: "about:blank",
      title: "Error",
      status: 400,
      detail: "",
    };
    expect(resolveProblemDetail(problem)).toBeUndefined();
  });

  test("returns undefined for whitespace-only detail", () => {
    const problem = {
      type: "about:blank",
      title: "Error",
      status: 400,
      detail: "   ",
    };
    expect(resolveProblemDetail(problem)).toBeUndefined();
  });

  test("returns trimmed detail string", () => {
    const problem = {
      type: "about:blank",
      title: "Error",
      status: 400,
      detail: "  Some error  ",
    };
    expect(resolveProblemDetail(problem)).toBe("Some error");
  });

  test("returns detail string without extra trimming when not needed", () => {
    const problem = {
      type: "about:blank",
      title: "Error",
      status: 400,
      detail: "Validation failed",
    };
    expect(resolveProblemDetail(problem)).toBe("Validation failed");
  });
});

describe("problemToError", () => {
  test("returns error with fallback message when problem is undefined", () => {
    const error = problemToError(undefined, "Default error");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Default error");
  });

  test("returns error with fallback message when problem has no detail", () => {
    const problem = { type: "about:blank", title: "Error", status: 400 };
    const error = problemToError(problem, "Fallback message");
    expect(error.message).toBe("Fallback message");
  });

  test("returns error with problem detail when available", () => {
    const problem = {
      type: "about:blank",
      title: "Validation Error",
      status: 422,
      detail: "Field X is required",
    };
    const error = problemToError(problem, "Fallback");
    expect(error.message).toBe("Field X is required");
  });

  test("returns error with fallback when detail is empty", () => {
    const problem = {
      type: "about:blank",
      title: "Error",
      status: 400,
      detail: "",
    };
    const error = problemToError(problem, "No detail provided");
    expect(error.message).toBe("No detail provided");
  });
});
