"use client";

import { useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  type FettmattisCreate,
  FettmattisCreateSchema,
} from "@/lib/api/schemas";

interface SimplePlayer {
  readonly id: string;
  readonly displayName: string;
  readonly active: boolean;
}

interface SimpleRound {
  readonly id: string;
}

interface FettmattisFormProps {
  readonly onSubmit: (data: FettmattisCreate) => void | Promise<void>;
  readonly players: readonly SimplePlayer[];
  readonly rounds: readonly SimpleRound[];
  readonly initialData?: FettmattisCreate;
}

export function FettmattisForm({
  onSubmit,
  players,
  initialData,
}: FettmattisFormProps) {
  const [playerId, setPlayerId] = useState(initialData?.player_id ?? "");
  const [roundId, setRoundId] = useState(initialData?.round_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const formId = useId();
  const playerSelectId = `${formId}-player`;
  const errorId = `${formId}-error`;

  useEffect(() => {
    if (!initialData) {
      return;
    }
    setPlayerId(initialData.player_id);
    setRoundId(initialData.round_id ?? "");
  }, [initialData]);

  useEffect(() => {
    if (playerId && !players.some((player) => player.id === playerId)) {
      setPlayerId("");
    }
  }, [playerId, players]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: FettmattisCreate = {
      player_id: playerId,
      ...(roundId ? { round_id: roundId } : {}),
    };

    const parsed = FettmattisCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues.at(0);
      setError(firstIssue?.message ?? "Kunne ikke sende inn Fettmattis.");
      return;
    }

    setError(null);
    await onSubmit(parsed.data);
    setRoundId("");
  };

  const isSubmitDisabled = playerId.length === 0;

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="flex flex-col gap-6"
    >
      <div className="space-y-2">
        <Label htmlFor={playerSelectId}>Spiller</Label>
        <div className="border-border/70 bg-background rounded-2xl border p-1">
          <select
            id={playerSelectId}
            value={playerId}
            onChange={(event) => setPlayerId(event.target.value)}
            className="bg-background focus-visible:ring-ring w-full rounded-2xl px-4 py-3 text-sm focus-visible:ring-2 focus-visible:outline-hidden"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
          >
            <option value="" disabled>
              Velg spilleren som hedres
            </option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.displayName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p id={errorId} className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitDisabled}>
        Tildel Fettmattis
      </Button>
    </form>
  );
}
