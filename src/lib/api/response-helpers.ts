import type {
  FettmattisRecord,
  PlayerRecord,
  RoundParticipantRecord,
  RoundRecord,
} from "@/lib/db-client";

import type { Fettmattis, Player, Round } from "./schemas";

export type PlayerResponseInput =
  | Pick<PlayerRecord, "id" | "displayName" | "active">
  | RoundParticipantRecord;

export type PlayerResponse = Player;

export type RoundResponse = Round;
export type FettmattisResponse = Fettmattis;

export function toPlayerResponse(player: PlayerResponseInput): PlayerResponse {
  return {
    id: player.id,
    display_name: player.displayName,
    active: player.active,
  };
}

export function toRoundResponse(round: RoundRecord): RoundResponse {
  return {
    id: round.id,
    created_at: round.createdAt.toISOString(),
    participants: round.participants.map(toPlayerResponse),
    loser: toPlayerResponse(round.loser),
  };
}

export function toFettmattisResponse(
  record: FettmattisRecord,
): FettmattisResponse {
  return {
    id: record.id,
    player: toPlayerResponse(record.player),
    created_at: record.createdAt.toISOString(),
    round_id: record.roundId ?? null,
  };
}
