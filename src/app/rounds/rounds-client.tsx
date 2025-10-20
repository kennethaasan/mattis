"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck, Trophy } from "lucide-react";
import { useMemo, useState } from "react";
import { FettMattisForm } from "@/components/FettMattisForm";
import { FettmattisTable } from "@/components/fettmattis-table";
import { PageShell } from "@/components/layout/page-shell";
import { RoundForm } from "@/components/RoundForm";
import { RoundsTable } from "@/components/rounds-table";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  createFettMattisListQueryKey,
  type FettMattis,
  fetchFettMattis,
  revokeFettMattis,
} from "@/lib/api/fettmattis-client";
import {
  fetchPlayers,
  PLAYERS_QUERY_KEY,
  type Player,
} from "@/lib/api/players-client";
import {
  createRoundsListQueryKey,
  deleteRound,
  fetchLatestRound,
  fetchRounds,
  LATEST_ROUND_QUERY_KEY,
  type Round,
} from "@/lib/api/rounds-client";
import {
  type FettMattisCreate,
  ProblemDetailsSchema,
  type RoundCreate,
} from "@/lib/api/schemas";

const resolveProblemDetail = (body: unknown): string | undefined => {
  const parsed = ProblemDetailsSchema.safeParse(body);
  if (!parsed.success) {
    return undefined;
  }
  return parsed.data.detail;
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

const ROUNDS_LIST_LIMIT = 25;
const FETTMATTIS_LIST_LIMIT = 25;

export default function RoundsClientPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const playersQuery = useQuery<Player[]>({
    queryKey: PLAYERS_QUERY_KEY,
    queryFn: fetchPlayers,
  });

  const players: Player[] = playersQuery.data ?? [];
  const isPlayersLoading = playersQuery.isLoading;
  const isPlayersFetching = playersQuery.isFetching;

  const latestRoundQuery = useQuery<Round | null>({
    queryKey: LATEST_ROUND_QUERY_KEY,
    queryFn: fetchLatestRound,
  });

  const roundsListQueryKey = createRoundsListQueryKey(ROUNDS_LIST_LIMIT);
  const fettMattisListQueryKey =
    createFettMattisListQueryKey(FETTMATTIS_LIST_LIMIT);

  const roundsQuery = useQuery<Round[], Error>({
    queryKey: roundsListQueryKey,
    queryFn: () => fetchRounds({ limit: ROUNDS_LIST_LIMIT }),
  });

  const fettMattisQuery = useQuery<FettMattis[], Error>({
    queryKey: fettMattisListQueryKey,
    queryFn: () => fetchFettMattis({ limit: FETTMATTIS_LIST_LIMIT }),
  });

  const rounds = roundsQuery.data ?? [];
  const fettMattisEntries = fettMattisQuery.data ?? [];
  const isRoundsLoading = roundsQuery.isLoading;
  const isRoundsFetching = roundsQuery.isFetching;
  const isFettMattisLoading = fettMattisQuery.isLoading;
  const isFettMattisFetching = fettMattisQuery.isFetching;

  const activePlayers = useMemo(
    () => players.filter((player) => player.active),
    [players]
  );

  const latestRoundParticipants = latestRoundQuery.data?.participants ?? [];
  const participantOrder = useMemo(
    () =>
      new Map(
        latestRoundParticipants.map(
          (participant, index) => [participant.id, index] as const
        )
      ),
    [latestRoundParticipants]
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
    [activePlayers, participantOrder]
  );

  const roundMutation = useMutation<undefined, Error, RoundCreate>({
    mutationFn: async (payload) => {
      const response = await fetch("/api/rounds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body: unknown = await response.json();
        const detail = resolveProblemDetail(body);
        throw new Error(detail ?? "Kunne ikke lagre runden.");
      }
    },
    onSuccess: () => {
      setStatus("Runde lagret. Tabellene er oppdatert!");
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: roundsListQueryKey,
      });
      void queryClient.invalidateQueries({
        queryKey: LATEST_ROUND_QUERY_KEY,
      });
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
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body: unknown = await response.json();
        const detail = resolveProblemDetail(body);
        throw new Error(detail ?? "Kunne ikke tildele en Fettmattis.");
      }
    },
    onSuccess: () => {
      setStatus("Fettmattis tildelt. Klar for feiring!");
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: fettMattisListQueryKey,
      });
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

  const deleteRoundMutation = useMutation<void, Error, string>({
    mutationFn: async (roundId) => deleteRound(roundId),
    onSuccess: () => {
      setStatus("Runde slettet. Tabellene er oppdatert!");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: roundsListQueryKey });
      void queryClient.invalidateQueries({
        queryKey: LATEST_ROUND_QUERY_KEY,
      });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (mutationError) => {
      setStatus(null);
      setError(mutationError.message);
    },
  });

  const revokeFettMattisMutation = useMutation<void, Error, string>({
    mutationFn: async (fettMattisId) => revokeFettMattis(fettMattisId),
    onSuccess: () => {
      setStatus("Fettmattis fjernet. Oversikten er oppdatert.");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: fettMattisListQueryKey });
      void queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (mutationError) => {
      setStatus(null);
      setError(mutationError.message);
    },
  });

  const handleRoundDelete = async (roundId: string) => {
    await deleteRoundMutation.mutateAsync(roundId);
  };

  const handleFettMattisDelete = async (fettMattisId: string) => {
    await revokeFettMattisMutation.mutateAsync(fettMattisId);
  };

  const deletingRoundIds =
    deleteRoundMutation.isPending && deleteRoundMutation.variables
      ? new Set([deleteRoundMutation.variables])
      : undefined;

  const deletingFettMattisIds =
    revokeFettMattisMutation.isPending &&
    revokeFettMattisMutation.variables
      ? new Set([revokeFettMattisMutation.variables])
      : undefined;

  return (
    <PageShell className="gap-10">
      <SectionHeader
        badge={
          <Badge
            variant="outline"
            className="border-primary/40 text-primary w-fit"
          >
            Kontrollsenter for runder
          </Badge>
        }
        title="Loggfør runder og Fettmattis-øyeblikk"
        description="Registrer spillerne, lås taperen og feir Fettmattis-utdelinger – alt fra ett sted."
      />

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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle>Registrerte runder</CardTitle>
              <CardDescription>
                De siste registreringene fra Mattis-boka.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void roundsQuery.refetch()}
              disabled={isRoundsFetching}
            >
              Oppdater
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <RoundsTable
              rounds={rounds}
              isLoading={isRoundsLoading}
              onDeleteRound={handleRoundDelete}
              deletingRoundIds={deletingRoundIds}
              emptyMessage="Ingen runder er registrert ennå."
            />
            {roundsQuery.error ? (
              <p className="text-destructive text-sm">
                {roundsQuery.error.message}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <CardTitle>Fettmattis-øyeblikk</CardTitle>
              <CardDescription>
                Feiringene som fortsatt kan justeres det siste døgnet.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fettMattisQuery.refetch()}
              disabled={isFettMattisFetching}
            >
              Oppdater
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <FettmattisTable
              fettMattis={fettMattisEntries}
              isLoading={isFettMattisLoading}
              onDelete={handleFettMattisDelete}
              deletingIds={deletingFettMattisIds}
            />
            {fettMattisQuery.error ? (
              <p className="text-destructive text-sm">
                {fettMattisQuery.error.message}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

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
    </PageShell>
  );
}
