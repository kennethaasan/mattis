import { test, expect, vi, beforeEach } from "vitest";
import { PlayerSchema } from "@/lib/api/schemas";
import { NextRequest } from "next/server";

vi.mock("@/lib/db-client", () => ({
  insertPlayer: vi.fn(),
  listPlayers: vi.fn(),
}));

const dbClient = (await import("@/lib/db-client")) as any;
const insertPlayer = dbClient.insertPlayer as any;
const listPlayers = dbClient.listPlayers as any;

const { POST, GET } = await import("@/app/api/players/route");

const MOCK_USER_ID = "00000000-0000-7000-0000-000000000000";
vi.stubEnv("DEV_USER_ID", MOCK_USER_ID);

const createMockRequest = (body?: unknown) => {
  return {
    json: async () => body,
    headers: new Headers({ "X-User-Id": MOCK_USER_ID }),
  } as unknown as NextRequest;
};

beforeEach(() => {
  insertPlayer.mockClear();
  listPlayers.mockClear();
});

test("INT001: create player then list returns created player", async () => {
  const newPlayer = { display_name: "Integration Player" };
  const mockPlayerResponse = {
    id: "00000000-0000-7000-0000-000000000099",
    display_name: newPlayer.display_name,
    active: true,
  };

  insertPlayer.mockResolvedValueOnce(mockPlayerResponse);
  listPlayers.mockResolvedValueOnce([mockPlayerResponse]);

  const postReq = createMockRequest(newPlayer);
  const postRes = await POST(postReq);

  expect(postRes.status).toBe(201);
  const createdBody = await postRes.json();
  expect(() => PlayerSchema.parse(createdBody)).not.toThrow();
  expect(createdBody.id).toBe(mockPlayerResponse.id);

  const getReq = createMockRequest();
  const getRes = await GET(getReq);
  expect(getRes.status).toBe(200);

  const listBody = await getRes.json();
  expect(Array.isArray(listBody)).toBe(true);
  expect(listBody.some((p: any) => p.id === mockPlayerResponse.id)).toBe(true);
});
