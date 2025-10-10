"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Trophy } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { RoundForm } from "@/components/RoundForm";
import { FettMattisForm } from "@/components/FettMattisForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FettMattisCreate, RoundCreate } from "@/lib/api/schemas";
import {
  PLAYERS_QUERY_KEY,
  fetchPlayers,
  type PlayersApiRecord,
} from "@/lib/api/players-client";

const DEFAULT_USER_ID =
  process.env.NEXT_PUBLIC_DEFAULT_USER_ID ??
  "00000000-0000-7000-0000-000000000000";

interface ProblemDetailPayload {
  readonly detail?: unknown;
  readonly error?: unknown;
}

const isMessageRecord = (value: unknown): value is { message: string } => {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  return typeof (value as { message?: unknown }).message === "string";
};

const extractErrorDetail = (body: unknown): string | undefined => {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }

  const candidate = body as ProblemDetailPayload;

  if (typeof candidate.detail === "string") {
    return candidate.detail;
  }

  if (Array.isArray(candidate.error)) {
    const errors = candidate.error as unknown[];
    for (const entry of errors) {
      if (isMessageRecord(entry)) {
        return entry.message;
      }
    }
  }

  return undefined;
};

export default function RoundsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const playersQuery = useQuery<PlayersApiRecord[]>({
    queryKey: PLAYERS_QUERY_KEY,
    queryFn: fetchPlayers,
  });

  const players: PlayersApiRecord[] = playersQuery.data ?? [];
  const isPlayersLoading = playersQuery.isLoading;
  const isPlayersFetching = playersQuery.isFetching;

  const hydratablePlayers = useMemo(
    () =>
      players.map((player) => ({
        id: player.id,
        displayName: player.display_name,
        active: player.active,
      })),
    [players],
  );

  const roundMutation = useMutation<undefined, Error, RoundCreate>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/rounds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": DEFAULT_USER_ID,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body: unknown = await response.json();
        const detail = extractErrorDetail(body);
        throw new Error(detail ?? "Kunne ikke lagre runden.");
      }
    },
    onSuccess: () => {
      setStatus("Runde lagret. Tabellene er oppdatert!");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (mutationError) => {
      setStatus(null);
      setError(mutationError.message);
    },
  });

  const fettMattisMutation = useMutation<undefined, Error, FettMattisCreate>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/fettmattis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": DEFAULT_USER_ID,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body: unknown = await response.json();
        const detail = extractErrorDetail(body);
        throw new Error(detail ?? "Kunne ikke tildele en Fettmattis.");
      }
    },
    onSuccess: () => {
      setStatus("Fettmattis tildelt. Klar for feiring!");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (mutationError) => {
      setStatus(null);
      setError(mutationError.message);
    },
  });

  const handleRoundSubmit = async (data: RoundCreate) => {
    await roundMutation.mutateAsync(data);
  };

  const handleFettMattisSubmit = async (data: FettMattisCreate) => {
    await fettMattisMutation.mutateAsync(data);
  };

  return (
    <div className="container space-y-10 pt-12 pb-16">
      <div className="flex flex-col gap-2 text-left">
        <Badge
          variant="outline"
          className="border-primary/40 text-primary w-fit"
        >
          Kontrollsenter for runder
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Loggfør runder og Fettmattis-øyeblikk
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Registrer spillerne, lås taperen og feir Fettmattis-utdelinger – alt
          fra ett sted.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="text-primary h-5 w-5" />
              Registrer en runde
            </CardTitle>
            <CardDescription>
              Velg minst to spillere og marker den uheldige taperen. Tallene
              oppdateres idet du lagrer.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPlayersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 h-12 w-full animate-pulse rounded-2xl"
                  />
                ))}
              </div>
            ) : (
              <RoundForm
                onSubmit={handleRoundSubmit}
                players={hydratablePlayers}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="text-primary h-5 w-5" />
              Tildel en Fettmattis
            </CardTitle>
            <CardDescription>
              En valgfri rundekobling holder historikken ryddig.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPlayersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="bg-muted/50 h-11 w-full animate-pulse rounded-2xl"
                  />
                ))}
              </div>
            ) : (
              <FettMattisForm
                onSubmit={handleFettMattisSubmit}
                players={hydratablePlayers}
                rounds={[]}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {status ? <p className="text-primary text-sm">{status}</p> : null}
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      {playersQuery.error ? (
        <p className="text-destructive text-sm">{playersQuery.error.message}</p>
      ) : null}

      <div className="border-border/70 bg-muted/30 text-muted-foreground flex flex-wrap items-center gap-3 rounded-3xl border px-4 py-5 text-xs">
        <span>
          Endringer kan redigeres i 24 timer – deretter låses posten for å verne
          om konkurransen.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void playersQuery.refetch()}
          disabled={isPlayersFetching}
        >
          Oppdater spillerliste
        </Button>
      </div>
    </div>
  );
}
