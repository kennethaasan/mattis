"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type RoundCreate, RoundCreateSchema } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

interface RoundFormPlayer {
  readonly id: string;
  readonly displayName: string;
  readonly active: boolean;
}

interface RoundFormProps {
  readonly onSubmit: (data: RoundCreate) => void | Promise<void>;
  readonly players: readonly RoundFormPlayer[];
  readonly initialData?: RoundCreate;
}

export function RoundForm({ onSubmit, players, initialData }: RoundFormProps) {
  const [participantIds, setParticipantIds] = useState<string[]>(
    initialData?.participant_ids ?? [],
  );
  const [loserId, setLoserId] = useState(initialData?.loser_id ?? "");
  const [error, setError] = useState<string | null>(null);
  const formId = useId();
  const loserSelectId = `${formId}-loser`;
  const errorId = `${formId}-error`;

  useEffect(() => {
    if (!initialData) {
      return;
    }
    setParticipantIds(initialData.participant_ids);
    setLoserId(initialData.loser_id);
  }, [initialData]);

  useEffect(() => {
    const validPlayerIds = new Set(players.map((player) => player.id));

    setParticipantIds((current) =>
      current.filter((participantId) => validPlayerIds.has(participantId)),
    );
  }, [players]);

  useEffect(() => {
    if (loserId && !participantIds.includes(loserId)) {
      setLoserId("");
    }
  }, [loserId, participantIds]);

  const participantOptions = useMemo(
    () =>
      players.map((player) => ({ id: player.id, label: player.displayName })),
    [players],
  );

  const loserOptions = participantOptions.filter((option) =>
    participantIds.includes(option.id),
  );

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
      setError(firstIssue?.message ?? "Kunne ikke lagre runden.");
      return;
    }

    setError(null);
    await onSubmit(parsed.data);
  };

  const isSubmitDisabled = participantIds.length < 2 || loserId.length === 0;

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="flex flex-col gap-6"
    >
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm tracking-wide uppercase">
          Deltakere
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {participantOptions.map((option) => {
            const isChecked = participantIds.includes(option.id);
            return (
              <button
                type="button"
                key={option.id}
                onClick={() => toggleParticipant(option.id)}
                className={cn(
                  "hover:border-primary/40 flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition",
                  isChecked
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground",
                )}
              >
                <span className="text-foreground font-medium">
                  {option.label}
                </span>
                <Badge variant={isChecked ? "success" : "outline"}>
                  {isChecked ? "Valgt" : "Trykk for å legge til"}
                </Badge>
              </button>
            );
          })}
        </div>
        <p className="text-muted-foreground text-xs">
          Velg minst to spillere for å aktivere valg av taper.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={loserSelectId}>Taper</Label>
        <div className="border-border/70 bg-background rounded-2xl border p-1">
          <select
            id={loserSelectId}
            value={loserId}
            onChange={(event) => setLoserId(event.target.value)}
            className="bg-background focus-visible:ring-ring w-full rounded-2xl px-4 py-3 text-sm focus-visible:ring-2 focus-visible:outline-hidden"
            disabled={loserOptions.length === 0}
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? errorId : undefined}
          >
            <option value="" disabled>
              {loserOptions.length === 0
                ? "Velg deltakere først"
                : "Velg taperen"}
            </option>
            {loserOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
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
        Lagre runde
      </Button>
    </form>
  );
}
