import type {
  PlayerRecord,
  RoundParticipantRecord,
  RoundRecord,
} from "@/lib/db-client";

import type { Player, Round } from "./schemas";

export type PlayerResponseInput =
  | Pick<PlayerRecord, "id" | "displayName" | "active">
  | RoundParticipantRecord;

export type PlayerResponse = Player;

export type RoundResponse = Round;

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
