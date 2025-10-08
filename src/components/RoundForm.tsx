"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RoundCreateSchema, type RoundCreate } from "@/lib/api/schemas";

type RoundFormPlayer = {
  id: string;
  displayName: string;
  active: boolean;
};

interface RoundFormProps {
  onSubmit: (data: RoundCreate) => void | Promise<void>;
  players: RoundFormPlayer[];
  initialData?: RoundCreate;
}

export function RoundForm({ onSubmit, players, initialData }: RoundFormProps) {
  const [participantIds, setParticipantIds] = useState<string[]>(initialData?.participant_ids ?? []);
  const [loserId, setLoserId] = useState(initialData?.loser_id ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setParticipantIds(initialData.participant_ids);
      setLoserId(initialData.loser_id);
    }
  }, [initialData?.loser_id, initialData?.participant_ids]);

  useEffect(() => {
    if (loserId && !participantIds.includes(loserId)) {
      setLoserId("");
    }
  }, [loserId, participantIds]);

  const participantOptions = useMemo(
    () => players.map((player) => ({ id: player.id, label: player.displayName })),
    [players],
  );

  const loserOptions = participantOptions.filter((option) => participantIds.includes(option.id));

  const toggleParticipant = (playerId: string) => {
    setParticipantIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: RoundCreate = {
      participant_ids: participantIds,
      loser_id: loserId,
    };

    const parsed = RoundCreateSchema.safeParse(payload);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues.at(0);
      setError(firstIssue?.message ?? "Unable to save round.");
      return;
    }

    setError(null);
    await onSubmit(parsed.data);
  };

  const isSubmitDisabled = participantIds.length < 2 || loserId.length === 0;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="space-y-3">
        <Label className="text-sm uppercase tracking-wide text-muted-foreground">
          Participants
        </Label>
        <div className="grid gap-2 sm:grid-cols-2">
          {participantOptions.map((option) => {
            const isChecked = participantIds.includes(option.id);
            return (
              <button
                type="button"
                key={option.id}
                onClick={() => toggleParticipant(option.id)}
                className={cn(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition hover:border-primary/40",
                  isChecked
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground",
                )}
              >
                <span className="font-medium text-foreground">{option.label}</span>
                <Badge variant={isChecked ? "success" : "outline-solid"}>
                  {isChecked ? "Selected" : "Tap to add"}
                </Badge>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Pick at least two players to unlock the loser selection.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="round-loser">Loser</Label>
        <div className="rounded-2xl border border-border/70 bg-background p-1">
          <select
            id="round-loser"
            value={loserId}
            onChange={(event) => setLoserId(event.target.value)}
            className="w-full rounded-2xl bg-background px-4 py-3 text-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            disabled={loserOptions.length === 0}
          >
            <option value="" disabled>
              {loserOptions.length === 0
                ? "Select participants first"
                : "Select the loser"}
            </option>
            {loserOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="submit" disabled={isSubmitDisabled}>
        Save round
      </Button>
    </form>
  );
}
