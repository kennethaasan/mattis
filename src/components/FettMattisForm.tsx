"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FettMattisCreateSchema, type FettMattisCreate } from "@/lib/api/schemas";

type SimplePlayer = {
  id: string;
  displayName: string;
  active: boolean;
};

type SimpleRound = {
  id: string;
};

interface FettMattisFormProps {
  onSubmit: (data: FettMattisCreate) => void | Promise<void>;
  players: SimplePlayer[];
  rounds: SimpleRound[];
  initialData?: FettMattisCreate;
}

export function FettMattisForm({ onSubmit, players, rounds, initialData }: FettMattisFormProps) {
  const [playerId, setPlayerId] = useState(initialData?.player_id ?? "");
  const [roundId, setRoundId] = useState(initialData?.round_id ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setPlayerId(initialData.player_id);
      setRoundId(initialData.round_id ?? "");
    }
  }, [initialData?.player_id, initialData?.round_id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: FettMattisCreate = {
      player_id: playerId,
      ...(roundId ? { round_id: roundId } : {}),
    };

    const parsed = FettMattisCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues.at(0);
      setError(firstIssue?.message ?? "Unable to submit FettMattis.");
      return;
    }

    setError(null);
    await onSubmit(parsed.data);
    setRoundId("");
  };

  const isSubmitDisabled = playerId.length === 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="space-y-2">
        <Label htmlFor="fettmattis-player">Player</Label>
        <div className="rounded-2xl border border-border/70 bg-background p-1">
          <select
            id="fettmattis-player"
            value={playerId}
            onChange={(event) => setPlayerId(event.target.value)}
            className="w-full rounded-2xl bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" disabled>
              Choose the honoured player
            </option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="fettmattis-round">Optional round link</Label>
          <span className="text-xs text-muted-foreground">Keeps the story straight</span>
        </div>
        <div className="rounded-2xl border border-border/60 bg-background p-1">
          <select
            id="fettmattis-round"
            value={roundId}
            onChange={(event) => setRoundId(event.target.value)}
            className="w-full rounded-2xl bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">No linked round</option>
            {rounds.map((round) => (
              <option key={round.id} value={round.id}>
                {round.id}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={isSubmitDisabled}>
        Grant FettMattis
      </Button>
    </form>
  );
}
