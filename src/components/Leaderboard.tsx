"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getFettmattisLeaderboard,
  getLeaderboardSeasons,
  getRegularLeaderboard,
} from "@/lib/leaderboard";
import type {
  FettmattisLeaderboard,
  LeaderboardScope,
  RegularLeaderboard,
} from "@/lib/leaderboard-types";

export function Leaderboard() {
  const [scope, setScope] = useState<LeaderboardScope>(
    () => new Date().getFullYear(),
  );
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const yearSelectId = useId();
  const seasonsQuery = useQuery<number[]>({
    queryKey: ["leaderboard", "seasons"],
    queryFn: getLeaderboardSeasons,
  });
  const regularQuery = useQuery<RegularLeaderboard>({
    queryKey: ["leaderboard", "regular", scope],
    queryFn: () => getRegularLeaderboard(scope),
  });

  const fettmattisQuery = useQuery<FettmattisLeaderboard>({
    queryKey: ["leaderboard", "fettmattis", scope],
    queryFn: () => getFettmattisLeaderboard(scope),
  });

  const regular = regularQuery.data ?? [];
  const fettmattis = fettmattisQuery.data ?? [];
  const regularLoading = regularQuery.isLoading || regularQuery.isFetching;
  const fettmattisLoading =
    fettmattisQuery.isLoading || fettmattisQuery.isFetching;
  const errorMessage =
    regularQuery.error?.message ?? fettmattisQuery.error?.message ?? null;
  const isAllTime = scope === "all";

  const availableSeasons = seasonsQuery.data ?? [];
  const yearOptions = useMemo(() => {
    const seasons =
      availableSeasons.length > 0 ? availableSeasons : [currentYear];
    const uniqueSeasons = Array.from(new Set(seasons)).sort(
      (a, b) => b - a,
    );

    return [
      { value: "all" as const, label: "Alle år" },
      ...uniqueSeasons.map((yearOption) => ({
        value: yearOption,
        label: yearOption.toString(),
      })),
    ];
  }, [availableSeasons, currentYear]);

  let regularContent: ReactNode;
  if (regularLoading) {
    regularContent = <TableSkeleton />;
  } else if (regular.length === 0) {
    regularContent = (
      <EmptyState
        message={
          isAllTime
            ? "Ingen runder registrert ennå."
            : "Ingen runder registrert denne sesongen ennå."
        }
      />
    );
  } else {
    regularContent = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Plass</TableHead>
            <TableHead>Spiller</TableHead>
            <TableHead className="text-right">Tap %</TableHead>
            <TableHead className="text-right">Tap</TableHead>
            <TableHead className="text-right">Runder</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {regular.map((entry) => (
            <TableRow key={entry.playerId}>
              <TableCell className="font-semibold">#{entry.rank}</TableCell>
              <TableCell className="flex items-center gap-3">
                <div className="flex flex-col">
                  <span className="text-foreground font-medium">
                    {entry.playerName}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {entry.roundsPlayed} runder spilt
                  </span>
                </div>
                <Badge
                  variant={entry.lossPercentage < 20 ? "success" : "outline"}
                >
                  {entry.lossPercentage.toFixed(1)}%
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {entry.lossPercentage.toFixed(1)}%
              </TableCell>
              <TableCell className="text-muted-foreground text-right">
                {entry.totalLosses}
              </TableCell>
              <TableCell className="text-muted-foreground text-right">
                {entry.roundsPlayed}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  let fettmattisContent: ReactNode;
  if (fettmattisLoading) {
    fettmattisContent = <TableSkeleton />;
  } else if (fettmattis.length === 0) {
    fettmattisContent = (
      <EmptyState
        message={
          isAllTime
            ? "Ingen Fettmattis utdelt ennå."
            : "Ingen Fettmattis utdelt i år ennå."
        }
      />
    );
  } else {
    fettmattisContent = (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Plass</TableHead>
            <TableHead>Spiller</TableHead>
            <TableHead className="text-right">FettMattis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fettmattis.map((entry) => (
            <TableRow key={entry.playerId}>
              <TableCell className="font-semibold">#{entry.rank}</TableCell>
              <TableCell className="flex items-center gap-3">
                <span className="text-foreground font-medium">
                  {entry.playerName}
                </span>
                <Badge variant="secondary">Fettmattis-helt</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground text-right">
                {entry.fettmattisCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-start gap-2 text-left">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Sesongoversikt for {isAllTime ? "alle år" : scope}
          </h2>
          <p className="text-muted-foreground max-w-2xl text-sm">
            Tap-prosentene oppdateres med én gang en runde lagres.
            Fettmattis-utdelinger følger 24-timersfristen for tilbakekalling.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label
            className="text-muted-foreground text-sm font-medium"
            htmlFor={yearSelectId}
          >
            Sesong
          </label>
          <div className="relative">
            <select
              id={yearSelectId}
              className="border-border/60 bg-background focus-visible:ring-ring h-10 appearance-none rounded-full border px-5 pr-12 text-sm font-medium shadow-xs transition focus-visible:ring-2 focus-visible:outline-hidden"
              value={String(scope)}
              onChange={(event) => {
                const value = event.target.value;
                setScope(value === "all" ? "all" : Number.parseInt(value, 10));
              }}
            >
              {yearOptions.map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4" />
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold tracking-tight md:text-xl">
              Vanlig tabell
            </h3>
            {regularLoading ? <LoadingNotice /> : null}
          </div>
          {regularContent}
        </section>
        <section className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-semibold tracking-tight md:text-xl">
              Fettmattis-utdelinger
            </h3>
            {fettmattisLoading ? <LoadingNotice /> : null}
          </div>
          {fettmattisContent}
        </section>
      </div>
    </div>
  );
}

function LoadingNotice() {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-[0.2em] uppercase">
      <Loader2 className="h-4 w-4 animate-spin" />
      Oppdaterer tabellene…
    </div>
  );
}

interface EmptyStateProps {
  readonly message: string;
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="border-border/70 bg-muted/40 flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-6 py-12 text-center">
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

const TABLE_SKELETON_KEYS = ["first", "second", "third", "fourth"] as const;

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {TABLE_SKELETON_KEYS.map((key) => (
        <div
          key={key}
          className="bg-muted/60 h-12 w-full animate-pulse rounded-2xl"
        />
      ))}
    </div>
  );
}
