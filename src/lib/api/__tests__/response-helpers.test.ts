import { describe, expect, test } from "vitest";

import {
  toFettMattisResponse,
  toPlayerResponse,
  toRoundResponse,
} from "@/lib/api/response-helpers";
import type {
  FettMattisRecord,
  RoundParticipantRecord,
  RoundRecord,
} from "@/lib/db-client";

describe("toPlayerResponse", () => {
  test("transforms player record to API response format", () => {
    const player: RoundParticipantRecord = {
      id: "player-123",
      displayName: "John Doe",
      active: true,
    };

    const result = toPlayerResponse(player);

    expect(result).toEqual({
      id: "player-123",
      display_name: "John Doe",
      active: true,
    });
  });

  test("handles inactive player", () => {
    const player: RoundParticipantRecord = {
      id: "player-456",
      displayName: "Jane Doe",
      active: false,
    };

    const result = toPlayerResponse(player);

    expect(result).toEqual({
      id: "player-456",
      display_name: "Jane Doe",
      active: false,
    });
  });

  test("transforms round participant record", () => {
    const participant: RoundParticipantRecord = {
      id: "participant-789",
      displayName: "Participant Name",
      active: true,
    };

    const result = toPlayerResponse(participant);

    expect(result).toEqual({
      id: "participant-789",
      display_name: "Participant Name",
      active: true,
    });
  });
});

describe("toRoundResponse", () => {
  test("transforms round record to API response format", () => {
    const round: RoundRecord = {
      id: "round-123",
      createdAt: new Date("2025-01-15T10:30:00Z"),
      createdBy: "user-1",
      deletedAt: null,
      participants: [
        { id: "p1", displayName: "Player 1", active: true },
        { id: "p2", displayName: "Player 2", active: true },
      ],
      loser: { id: "p1", displayName: "Player 1", active: true },
    };

    const result = toRoundResponse(round);

    expect(result).toEqual({
      id: "round-123",
      created_at: "2025-01-15T10:30:00.000Z",
      participants: [
        { id: "p1", display_name: "Player 1", active: true },
        { id: "p2", display_name: "Player 2", active: true },
      ],
      loser: { id: "p1", display_name: "Player 1", active: true },
    });
  });

  test("handles round with many participants", () => {
    const round: RoundRecord = {
      id: "round-456",
      createdAt: new Date("2025-06-20T15:00:00Z"),
      createdBy: "user-2",
      deletedAt: null,
      participants: [
        { id: "p1", displayName: "Alice", active: true },
        { id: "p2", displayName: "Bob", active: true },
        { id: "p3", displayName: "Charlie", active: false },
        { id: "p4", displayName: "Diana", active: true },
      ],
      loser: { id: "p3", displayName: "Charlie", active: false },
    };

    const result = toRoundResponse(round);

    expect(result.participants).toHaveLength(4);
    expect(result.loser.id).toBe("p3");
    expect(result.loser.active).toBe(false);
  });
});

describe("toFettMattisResponse", () => {
  test("transforms fettmattis record with round_id", () => {
    const record: FettMattisRecord = {
      id: "fm-123",
      player: { id: "p1", displayName: "Winner", active: true },
      createdAt: new Date("2025-03-10T12:00:00Z"),
      createdBy: "user-1",
      revokedAt: null,
      roundId: "round-abc",
    };

    const result = toFettMattisResponse(record);

    expect(result).toEqual({
      id: "fm-123",
      player: { id: "p1", display_name: "Winner", active: true },
      created_at: "2025-03-10T12:00:00.000Z",
      round_id: "round-abc",
    });
  });

  test("transforms fettmattis record without round_id", () => {
    const record: FettMattisRecord = {
      id: "fm-456",
      player: { id: "p2", displayName: "Another Winner", active: true },
      createdAt: new Date("2025-04-15T09:30:00Z"),
      createdBy: "user-2",
      revokedAt: null,
      roundId: null,
    };

    const result = toFettMattisResponse(record);

    expect(result).toEqual({
      id: "fm-456",
      player: { id: "p2", display_name: "Another Winner", active: true },
      created_at: "2025-04-15T09:30:00.000Z",
      round_id: null,
    });
  });

  test("transforms fettmattis record with undefined round_id", () => {
    const record: FettMattisRecord = {
      id: "fm-789",
      player: { id: "p3", displayName: "Third Player", active: false },
      createdAt: new Date("2025-05-20T18:45:00Z"),
      createdBy: "user-3",
      revokedAt: null,
      roundId: undefined,
    };

    const result = toFettMattisResponse(record);

    expect(result.round_id).toBeNull();
  });
});
