"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/layout/page-shell";
import { PlayerForm } from "@/components/PlayerForm";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createPlayer,
  fetchPlayers,
  PLAYERS_QUERY_KEY,
  type Player,
  type PlayerUpdate,
  updatePlayer,
} from "@/lib/api/players-client";
import type { PlayerCreate } from "@/lib/api/schemas";

const ROSTER_SKELETON_KEYS = [
  "roster-row-1",
  "roster-row-2",
  "roster-row-3",
  "roster-row-4",
  "roster-row-5",
] as const;

export default function PlayersClientPage() {
  const queryClient = useQueryClient();
  const [updatingPlayerId, setUpdatingPlayerId] = useState<string | null>(null);
  const [confirmingStatusChange, setConfirmingStatusChange] = useState<{
    player: Player;
    newActive: boolean;
  } | null>(null);

  const playersQuery = useQuery<Player[]>({
    queryKey: PLAYERS_QUERY_KEY,
    queryFn: fetchPlayers,
  });

  const players: Player[] = playersQuery.data ?? [];

  const createPlayerMutation = useMutation<Player, Error, PlayerCreate>({
    mutationFn: createPlayer,
    onSuccess: async () => {
      toast.success("Spiller lagt til i troppen. Velkommen!");
      await queryClient.invalidateQueries({ queryKey: PLAYERS_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(`Kunne ikke legge til spiller: ${error.message}`);
    },
  });

  const activeCount = useMemo(
    () => players.filter((player) => player.active).length,
    [players],
  );

  const handlePlayerSubmit = async (data: PlayerCreate) => {
    await createPlayerMutation.mutateAsync(data);
  };

  const updatePlayerMutation = useMutation<
    Player,
    Error,
    { playerId: string; payload: PlayerUpdate }
  >({
    mutationFn: async ({ playerId, payload }) => {
      return updatePlayer(playerId, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: PLAYERS_QUERY_KEY });
    },
  });

  const handlePlayerUpdate = async (player: Player, payload: PlayerUpdate) => {
    setUpdatingPlayerId(player.id);

    try {
      const updated = await updatePlayerMutation.mutateAsync({
        playerId: player.id,
        payload,
      });

      toast.success(
        `${updated.display_name} er nå ${updated.active ? "aktiv" : "inaktiv"}.`,
      );
    } catch (error) {
      toast.error(
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
        {ROSTER_SKELETON_KEYS.map((key) => (
          <div
            key={key}
            className="bg-muted/50 h-12 w-full animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );
  } else if (players.length > 0) {
    rosterContent = (
      <div className="overflow-x-auto">
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
                          setConfirmingStatusChange({
                            player,
                            newActive: !player.active,
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
                      setConfirmingStatusChange({
                        player,
                        newActive: !player.active,
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
      </div>
    );
  } else {
    rosterContent = (
      <div className="border-border/60 bg-muted/40 text-muted-foreground flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-6 py-12 text-center text-sm">
        Ingen spillere ennå – legg til din første deltaker for å komme i gang.
      </div>
    );
  }

  return (
    <PageShell className="gap-10">
      <SectionHeader
        badge={
          <Badge variant="outline" className="border-primary/40 text-primary">
            Verktøy for troppen
          </Badge>
        }
        title="Administrer Mattis-gjengen"
        description="Opprett nye spillere, behold inaktive legender i arkivet og hold navnelisten ryddig til hver runde."
        titleAs="h1"
        descriptionClassName="max-w-2xl"
      />

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
          <CardContent className="space-y-4">{rosterContent}</CardContent>
        </Card>
      </div>

      <AlertDialog
        open={confirmingStatusChange !== null}
        onOpenChange={(open) => !open && setConfirmingStatusChange(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Endre spillerstatus?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil sette{" "}
              <span className="font-semibold">
                {confirmingStatusChange?.player.display_name}
              </span>{" "}
              som {confirmingStatusChange?.newActive ? "aktiv" : "inaktiv"}?
              {confirmingStatusChange?.newActive
                ? " Spilleren vil bli valgbar i nye runder."
                : " Spilleren vil ikke lenger dukke opp som et valg når du registrerer nye runder."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmingStatusChange) {
                  void handlePlayerUpdate(confirmingStatusChange.player, {
                    active: confirmingStatusChange.newActive,
                  });
                  setConfirmingStatusChange(null);
                }
              }}
            >
              Bekreft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
