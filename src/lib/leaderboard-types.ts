export type RegularLeaderboard = {
  playerId: string;
  playerName: string;
  totalLosses: number;
  roundsPlayed: number;
  lossPercentage: number;
}[];

export type FettmattisLeaderboard = {
  playerId: string;
  playerName: string;
  fettmattisCount: number;
}[];
