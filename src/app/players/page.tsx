"use client";

import { useMemo, useState } from "react";
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
  resolvePlayerError,
  type PlayersApiRecord,
} from "@/lib/api/players-client";

export default function PlayersPage() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const playersQuery = useQuery({
    queryKey: PLAYERS_QUERY_KEY,
    queryFn: fetchPlayers,
  });

  const players = playersQuery.data ?? [];

  const createPlayerMutation = useMutation<PlayersApiRecord, Error, PlayerCreate>({
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
        throw new Error(detail ?? "Unable to create player");
      }

      return (await response.json()) as PlayersApiRecord;
    },
    onSuccess: async () => {
      setMessage("Player added to the roster. Welcome aboard!");
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

  let rosterContent: React.ReactNode;
  if (playersQuery.isLoading) {
    rosterContent = (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-12 w-full animate-pulse rounded-2xl bg-muted/50"
          />
        ))}
      </div>
    );
  } else if (players.length > 0) {
    rosterContent = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Player</TableHead>
            <TableHead className="hidden sm:table-cell">Status</TableHead>
            <TableHead className="hidden sm:table-cell text-right">ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {player.display_name}
                  </span>
                  <span className="text-xs text-muted-foreground sm:hidden">
                    {player.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={player.active ? "success" : "outline-solid"}>
                  {player.active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-xs text-muted-foreground text-right">
                {player.id.slice(0, 8)}…
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  } else {
    rosterContent = (
      <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/60 bg-muted/40 px-6 py-12 text-center text-sm text-muted-foreground">
        No players yet – add your first competitor to get started.
      </div>
    );
  }

  return (
    <div className="container space-y-10 pb-16 pt-12">
      <div className="flex flex-col gap-2 text-left">
        <Badge variant="outline" className="w-fit border-primary/40 text-primary">
          Team roster tools
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Manage the Mattis crew
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Create new players, keep inactive legends in the archive and maintain a clean set of names for every round.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Invite a player</CardTitle>
            <CardDescription>
              Display names remain editable later – keep it short, sharp and unique.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <PlayerForm onSubmit={handlePlayerSubmit} />
            {message ? (
              <p className="text-sm text-primary">{message}</p>
            ) : null}
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            {playersQuery.error ? (
              <p className="text-sm text-destructive">
                {playersQuery.error.message}
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">Active roster</CardTitle>
              <CardDescription>
                {activeCount} active · {players.length - activeCount} inactive
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void playersQuery.refetch()}
              disabled={playersQuery.isFetching}
            >
              <RefreshCcw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </CardHeader>
          <CardContent>{rosterContent}</CardContent>
        </Card>
      </div>
    </div>
  );
}
