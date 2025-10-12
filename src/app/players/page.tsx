"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCcw } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PlayerForm } from "@/components/PlayerForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { PlayerCreate } from "@/lib/api/schemas";
import {
  PLAYERS_QUERY_KEY,
  fetchPlayers,
  type PlayersApiRecord,
} from "@/lib/api/players-client";
import { extractProblemDetailMessage } from "@/lib/api/problem-details.client";
import { useAuth } from "@/contexts/AuthContext";

export default function PlayersPage() {
  const router = useRouter();
  const { authorization, isReady } = useAuth();
  const authToken: string | null = authorization;
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && authorization === null) {
      const next = encodeURIComponent("/players");
      router.replace(`/login?next=${next}`);
    }
  }, [authorization, isReady, router]);

  const isAuthenticated = authorization !== null;

  const playersQuery = useQuery<PlayersApiRecord[]>({
    queryKey: [...PLAYERS_QUERY_KEY, authorization],
    queryFn: () => fetchPlayers(authorization ?? undefined),
    enabled: isAuthenticated,
  });

  const players: PlayersApiRecord[] = playersQuery.data ?? [];

  if (!isReady) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Laster inn…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const createPlayerMutation = useMutation<
    PlayersApiRecord,
    Error,
    PlayerCreate
  >({
    mutationFn: async (payload) => {
      if (authToken === null) {
        throw new Error("Du må være innlogget for å legge til spillere.");
      }

      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authToken,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const detail = extractProblemDetailMessage(await response.json());
        throw new Error(detail ?? "Kunne ikke opprette spiller");
      }

      return (await response.json()) as PlayersApiRecord;
    },
    onSuccess: async () => {
      setMessage("Spiller lagt til i troppen. Velkommen!");
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: PLAYERS_QUERY_KEY });
    },
    onError: (error) => {
      setMessage(null);
      setFormError(error.message);
    },
  });

  const activeCount = useMemo(
    () => players.filter((player) => player.active).length,
    [players],
  );

  const handlePlayerSubmit = async (data: PlayerCreate) => {
    if (authToken === null) {
      setFormError("Du må være innlogget for å legge til spillere.");
      return;
    }

    setMessage(null);
    setFormError(null);
    await createPlayerMutation.mutateAsync(data);
  };

  let rosterContent: React.ReactNode;
  if (playersQuery.status === "pending") {
    rosterContent = (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="bg-muted/50 h-12 w-full animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );
  } else if (players.length > 0) {
    rosterContent = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Spiller</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="hidden text-right sm:table-cell">
              ID
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">
                    {player.display_name}
                  </span>
                  <span className="text-muted-foreground text-xs sm:hidden">
                    {player.active ? "Aktiv" : "Inaktiv"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={player.active ? "success" : "outline"}>
                  {player.active ? "Aktiv" : "Inaktiv"}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground hidden text-right text-xs sm:table-cell">
                {player.id.slice(0, 8)}…
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else {
    rosterContent = (
      <div className="border-border/60 bg-muted/40 text-muted-foreground flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-6 py-12 text-center text-sm">
        Ingen spillere ennå – legg til din første deltaker for å komme i gang.
      </div>
    );
  }

  return (
    <div className="container space-y-10 pt-12 pb-16">
      <div className="flex flex-col gap-2 text-left">
        <Badge
          variant="outline"
          className="border-primary/40 text-primary w-fit"
        >
          Verktøy for troppen
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Administrer Mattis-gjengen
        </h1>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Opprett nye spillere, behold inaktive legender i arkivet og hold
          navnelisten ryddig til hver runde.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Inviter en spiller</CardTitle>
            <CardDescription>
              Du kan endre navnet senere – hold det kort, tydelig og unikt.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlayerForm onSubmit={handlePlayerSubmit} />
            {message ? <p className="text-primary text-sm">{message}</p> : null}
            {formError ? (
              <p className="text-destructive text-sm">{formError}</p>
            ) : null}
            {playersQuery.error ? (
              <p className="text-destructive text-sm">
                {playersQuery.error.message}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Aktiv spillerliste</CardTitle>
              <CardDescription>
                {activeCount} aktive · {players.length - activeCount} inaktive
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void playersQuery.refetch()}
              disabled={playersQuery.isFetching}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Oppdater
            </Button>
          </CardHeader>
          <CardContent>{rosterContent}</CardContent>
        </Card>
      </div>
    </div>
  );
}
