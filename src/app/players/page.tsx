"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { PlayerForm } from "@/components/PlayerForm";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchPlayers,
  PLAYERS_QUERY_KEY,
  type PlayersApiRecord,
  type PlayerUpdatePayload,
  resolvePlayerError,
  updatePlayer,
} from "@/lib/api/players-client";
import type { PlayerCreate } from "@/lib/api/schemas";

export default function PlayersPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [rosterMessage, setRosterMessage] = useState<string | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [updatingPlayerId, setUpdatingPlayerId] = useState<string | null>(null);

  const playersQuery = useQuery<PlayersApiRecord[]>({
    queryKey: PLAYERS_QUERY_KEY,
    queryFn: fetchPlayers,
  });

  const players: PlayersApiRecord[] = playersQuery.data ?? [];

  const createPlayerMutation = useMutation<
    PlayersApiRecord,
    Error,
    PlayerCreate
  >({
    mutationFn: async (payload) => {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const detail = resolvePlayerError(await response.json());
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
    setMessage(null);
    setFormError(null);
    await createPlayerMutation.mutateAsync(data);
  };

  const updatePlayerMutation = useMutation<
    PlayersApiRecord,
    Error,
    { playerId: string; payload: PlayerUpdatePayload }
  >({
    mutationFn: async ({ playerId, payload }) => {
      return updatePlayer(playerId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PLAYERS_QUERY_KEY });
    },
  });

  const handlePlayerUpdate = async (
    player: PlayersApiRecord,
    payload: PlayerUpdatePayload,
  ) => {
    setRosterMessage(null);
    setRosterError(null);
    setUpdatingPlayerId(player.id);

    try {
      const updated = await updatePlayerMutation.mutateAsync({
        playerId: player.id,
        payload,
      });

      setRosterMessage(
        `${updated.display_name} er nå ${updated.active ? "aktiv" : "inaktiv"}.`,
      );
    } catch (error) {
      setRosterError(
        error instanceof Error
          ? error.message
          : "Kunne ikke oppdatere spillerstatus.",
      );
    } finally {
      setUpdatingPlayerId(null);
    }
  };

  let rosterContent: React.ReactNode;
  if (playersQuery.isLoading) {
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
              Handling
            </TableHead>
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
                  <div className="mt-2 flex flex-wrap gap-2 sm:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void handlePlayerUpdate(player, {
                          active: !player.active,
                        })
                      }
                      disabled={updatingPlayerId === player.id}
                    >
                      {player.active ? "Sett som inaktiv" : "Sett som aktiv"}
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={player.active ? "success" : "outline"}>
                  {player.active ? "Aktiv" : "Inaktiv"}
                </Badge>
              </TableCell>
              <TableCell className="hidden text-right sm:table-cell">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    void handlePlayerUpdate(player, {
                      active: !player.active,
                    })
                  }
                  disabled={updatingPlayerId === player.id}
                >
                  {player.active ? "Sett som inaktiv" : "Sett som aktiv"}
                </Button>
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
          <CardContent className="space-y-4">
            {rosterContent}
            {rosterMessage ? (
              <p className="text-primary text-sm">{rosterMessage}</p>
            ) : null}
            {rosterError ? (
              <p className="text-destructive text-sm">{rosterError}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
