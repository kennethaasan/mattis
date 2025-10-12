export interface ApiPlayer {
  id: string;
  display_name: string;
  active: boolean;
}

interface PlayerLike {
  id: string;
  displayName: string;
  active: boolean;
}

export function toApiPlayer(player: PlayerLike): ApiPlayer {
  return {
    id: player.id,
    display_name: player.displayName,
    active: player.active,
  };
}

export interface ApiRound {
  id: string;
  created_at: string;
  participants: ApiPlayer[];
  loser: ApiPlayer;
}

interface RoundLike {
  id: string;
  createdAt: Date;
  participants: PlayerLike[];
  loser: PlayerLike;
}

export function toApiRound(round: RoundLike): ApiRound {
  return {
    id: round.id,
    created_at: round.createdAt.toISOString(),
    participants: round.participants.map(toApiPlayer),
    loser: toApiPlayer(round.loser),
  };
}

export interface ApiFettMattis {
  id: string;
  player: ApiPlayer;
  created_at: string;
}

interface FettMattisLike {
  id: string;
  player: PlayerLike;
  createdAt: Date;
}

export function toApiFettMattis(record: FettMattisLike): ApiFettMattis {
  return {
    id: record.id,
    player: toApiPlayer(record.player),
    created_at: record.createdAt.toISOString(),
  };
}
