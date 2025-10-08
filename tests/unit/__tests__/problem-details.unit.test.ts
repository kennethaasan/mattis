import { expect, test } from "vitest";

import {
  badRequest,
  conflict,
  createProblemResponse,
  forbidden,
  gone,
  notFound,
} from "@/lib/api/problem-details";

test("problem details factory enforces RFC members and sanitises extensions", async () => {
  const response = createProblemResponse({
    status: 422,
    title: "Validation Failed",
    detail: "Missing fields",
    instance: "/api/resource/1",
    type: "https://example.com/problems/validation",
    extra: { nested: "not allowed" },
    traceId: "abc123",
  });

  expect(response.status).toBe(422);
  const payload = await response.json();
  expect(payload).toEqual({
    type: "https://example.com/problems/validation",
    title: "Validation Failed",
    status: 422,
    detail: "Missing fields",
    instance: "/api/resource/1",
    traceId: "abc123",
  });
});

test("helper factories set the expected status codes and titles", async () => {
  await expect(badRequest("Bad").json()).resolves.toMatchObject({
    title: "Bad Request",
    status: 400,
    detail: "Bad",
  });

  await expect(notFound("Missing").json()).resolves.toMatchObject({
    title: "Not Found",
    status: 404,
    detail: "Missing",
  });

  await expect(conflict("Conflict").json()).resolves.toMatchObject({
    title: "Conflict",
    status: 409,
    detail: "Conflict",
  });

  await expect(forbidden("Forbidden").json()).resolves.toMatchObject({
    title: "Forbidden",
    status: 403,
    detail: "Forbidden",
  });

  await expect(gone("Gone").json()).resolves.toMatchObject({
    title: "Gone",
    status: 410,
    detail: "Gone",
  });
});
