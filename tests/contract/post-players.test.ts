import { test, expect, vi, beforeEach } from "vitest";
import { PlayerSchema, ProblemDetailsSchema } from "@/lib/api/schemas";
import { NextRequest } from "next/server";

vi.mock("@/lib/db-client", () => ({
  insertPlayer: vi.fn(),
}));

const dbClient = (await import("@/lib/db-client")) as any;
const insertPlayer = dbClient.insertPlayer as any;

const { POST } = await import("@/app/api/players/route");

const MOCK_USER_ID = "00000000-0000-7000-0000-000000000000";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

const createMockRequest = (body: unknown) => {
  return {
    headers: new Headers({ "X-User-Id": MOCK_USER_ID }),
    json: async () => body,
  } as unknown as NextRequest;
};

beforeEach(() => {
  insertPlayer.mockClear();
});

test("T010: POST /api/players should create player and return 201", async () => {
  const input = { display_name: "Charlie" };
  const created = { id: "00000000-0000-7000-0000-000000000020", display_name: "Charlie", active: true };

  insertPlayer.mockResolvedValueOnce(created);

  const req = createMockRequest(input);
  const res = await POST(req);

  expect(res.status).toBe(201);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/json");

  const body = await res.json();
  expect(() => PlayerSchema.parse(body)).not.toThrow();
  expect(insertPlayer).toHaveBeenCalledWith({ displayName: input.display_name, userId: MOCK_USER_ID });
});

test("T010: POST /api/players should return 400 for invalid input", async () => {
  const input = { name: "NoDisplayName" };
  const req = createMockRequest(input);
  const res = await POST(req);

  expect(res.status).toBe(400);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/problem+json");

  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
});

test("T010: POST /api/players should return 500 on DB error", async () => {
  const input = { display_name: "Dana" };
  const dbError = new Error("DB down");
  insertPlayer.mockRejectedValueOnce(dbError);

  const req = createMockRequest(input);
  const res = await POST(req);

  expect(res.status).toBe(500);
  expect(String(res.headers.get("Content-Type") || "")).toContain("application/problem+json");

  const body = await res.json();
  expect(() => ProblemDetailsSchema.parse(body)).not.toThrow();
});
