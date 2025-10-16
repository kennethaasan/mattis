"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { FettMattisForm } from "@/components/FettMattisForm";
import { RoundForm } from "@/components/RoundForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchPlayers,
  PLAYERS_QUERY_KEY,
  type PlayersApiRecord,
} from "@/lib/api/players-client";
import {
  fetchLatestRound,
  LATEST_ROUND_QUERY_KEY,
  type RoundApiRecord,
} from "@/lib/api/rounds-client";
import type { FettMattisCreate, RoundCreate } from "@/lib/api/schemas";

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

const ROUND_FORM_SKELETON_KEYS = [
  "round-skeleton-1",
  "round-skeleton-2",
  "round-skeleton-3",
  "round-skeleton-4",
] as const;

const FETTMATTIS_FORM_SKELETON_KEYS = [
  "fettmattis-skeleton-1",
  "fettmattis-skeleton-2",
  "fettmattis-skeleton-3",
] as const;

export default function RoundsClientPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getAuthHeader } = useAuth();
  const authHeader = getAuthHeader();

  const playersQuery = useQuery<PlayersApiRecord[]>({
    queryKey: PLAYERS_QUERY_KEY,
    queryFn: fetchPlayers,
  });

  const players: PlayersApiRecord[] = playersQuery.data ?? [];
  const isPlayersLoading = playersQuery.isLoading;
  const isPlayersFetching = playersQuery.isFetching;

  const latestRoundQuery = useQuery<RoundApiRecord | null>({
    queryKey: LATEST_ROUND_QUERY_KEY,
    queryFn: fetchLatestRound,
  });

  const activePlayers = useMemo(
    () => players.filter((player) => player.active),
    [players],
  );

  const latestRoundParticipants = latestRoundQuery.data?.participants ?? [];
  const participantOrder = useMemo(
    () =>
      new Map(
        latestRoundParticipants.map(
          (participant, index) => [participant.id, index] as const,
        ),
      ),
    [latestRoundParticipants],
  );

  const hydratablePlayers = useMemo(
    () =>
      activePlayers
        .map((player) => ({
          id: player.id,
          displayName: player.display_name,
          active: player.active,
        }))
        .sort((a, b) => {
          const aOrder = participantOrder.get(a.id);
          const bOrder = participantOrder.get(b.id);

          if (aOrder !== undefined && bOrder !== undefined) {
            return aOrder - bOrder;
          }

          if (aOrder !== undefined) {
            return -1;
          }

          if (bOrder !== undefined) {
            return 1;
          }

          return a.displayName.localeCompare(b.displayName);
        }),
    [activePlayers, participantOrder],
  );

  const roundMutation = useMutation<undefined, Error, RoundCreate>({
    mutationFn: async (payload) => {
      if (!authHeader) {
        throw new Error("Innlogging kreves for å registrere runder.");
      }
      const response = await fetch("/api/rounds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
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
      if (!authHeader) {
        throw new Error("Innlogging kreves for å tildele Fettmattis.");
      }
      const response = await fetch("/api/fettmattis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader,
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
                {ROUND_FORM_SKELETON_KEYS.map((key) => (
                  <div
                    key={key}
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
            {latestRoundQuery.error ? (
              <p className="text-muted-foreground text-xs">
                Kunne ikke hente forrige runde – alfabetisk rekkefølge brukes.
              </p>
            ) : null}
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
                {FETTMATTIS_FORM_SKELETON_KEYS.map((key) => (
                  <div
                    key={key}
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
