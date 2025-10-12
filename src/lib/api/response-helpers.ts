import type {
  PlayerRecord,
  RoundParticipantRecord,
  RoundRecord,
} from "@/lib/db-client";

export type PlayerResponseInput =
  | Pick<PlayerRecord, "id" | "displayName" | "active">
  | RoundParticipantRecord;

export interface PlayerResponse {
  id: string;
  display_name: string;
  active: boolean;
}

export interface RoundResponse {
  id: string;
  created_at: string;
  participants: PlayerResponse[];
  loser: PlayerResponse;
}

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
