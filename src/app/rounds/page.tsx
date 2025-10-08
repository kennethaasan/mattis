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
  process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? "00000000-0000-7000-0000-000000000000";

interface ProblemDetailPayload {
  readonly detail?: unknown;
  readonly error?: unknown;
}

const extractErrorDetail = (body: unknown): string | undefined => {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }

  const candidate = body as ProblemDetailPayload;

  if (typeof candidate.detail === "string") {
    return candidate.detail;
  }

  if (Array.isArray(candidate.error)) {
    const [firstError] = candidate.error;
    if (
      typeof firstError === "object" &&
      firstError !== null &&
      "message" in firstError &&
      typeof (firstError as { message?: unknown }).message === "string"
    ) {
      return (firstError as { message: string }).message;
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
        throw new Error(detail ?? "Unable to save round.");
      }
    },
    onSuccess: () => {
      setStatus("Round recorded. Leaderboards just updated!");
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
        throw new Error(detail ?? "Unable to grant a FettMattis.");
      }
    },
    onSuccess: () => {
      setStatus("FettMattis granted. Time to celebrate!");
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
    <div className="container space-y-10 pb-16 pt-12">
      <div className="flex flex-col gap-2 text-left">
        <Badge variant="outline" className="w-fit border-primary/40 text-primary">
          Round control centre
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Log rounds & FettMattis moments
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Record the players, lock in the loser and celebrate FettMattis recognitions – all from a single hub.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Record a round
            </CardTitle>
            <CardDescription>
              Pick at least two players and mark the unlucky loser. Stats update instantly after saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPlayersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 w-full animate-pulse rounded-2xl bg-muted/50"
                  />
                ))}
              </div>
            ) : (
              <RoundForm onSubmit={handleRoundSubmit} players={hydratablePlayers} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Grant a FettMattis
            </CardTitle>
            <CardDescription>
              Optional round links keep history aligned with your audit trail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isPlayersLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-11 w-full animate-pulse rounded-2xl bg-muted/50"
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

      {status ? <p className="text-sm text-primary">{status}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {playersQuery.error ? (
        <p className="text-sm text-destructive">
          {playersQuery.error.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border/70 bg-muted/30 px-4 py-5 text-xs text-muted-foreground">
        <span>
          Changes are editable for 24 hours – after that the record is locked to protect the competition.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void playersQuery.refetch()}
          disabled={isPlayersFetching}
        >
          Refresh roster
        </Button>
      </div>
    </div>
  );
}
