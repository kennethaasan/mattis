"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getFettmattisLeaderboard, getRegularLeaderboard } from "@/lib/leaderboard";
import type {
  FettmattisLeaderboard,
  RegularLeaderboard,
} from "@/lib/leaderboard-types";

export function Leaderboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const regularQuery = useQuery<RegularLeaderboard>({
    queryKey: ["leaderboard", "regular", year],
    queryFn: () => getRegularLeaderboard(year),
  });

  const fettmattisQuery = useQuery<FettmattisLeaderboard>({
    queryKey: ["leaderboard", "fettmattis", year],
    queryFn: () => getFettmattisLeaderboard(year),
  });

  const regular = regularQuery.data ?? [];
  const fettmattis = fettmattisQuery.data ?? [];
  const regularLoading = regularQuery.isLoading || regularQuery.isFetching;
  const fettmattisLoading = fettmattisQuery.isLoading || fettmattisQuery.isFetching;
  const errorMessage =
    regularQuery.error?.message ?? fettmattisQuery.error?.message ?? null;

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => now - index);
  }, []);

  let regularContent;
  if (regularLoading) {
    regularContent = <TableSkeleton />;
  } else if (regular.length === 0) {
    regularContent = <EmptyState message="Ingen runder registrert denne sesongen ennå." />;
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
                  <span className="font-medium text-foreground">
                    {entry.playerName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {entry.roundsPlayed} runder spilt
                  </span>
                </div>
                <Badge variant={entry.lossPercentage < 30 ? "success" : "outline"}>
                  {entry.lossPercentage.toFixed(1)}%
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                {entry.lossPercentage.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {entry.totalLosses}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {entry.roundsPlayed}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  let fettmattisContent;
  if (fettmattisLoading) {
    fettmattisContent = <TableSkeleton />;
  } else if (fettmattis.length === 0) {
    fettmattisContent = <EmptyState message="Ingen Fettmattis utdelt i år ennå." />;
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
                <span className="font-medium text-foreground">
                  {entry.playerName}
                </span>
                <Badge variant="secondary">Fettmattis-helt</Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
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
            Sesongoversikt for {year}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Tap-prosentene oppdateres med én gang en runde lagres. Fettmattis-utdelinger følger 24-timersfristen for tilbakekalling.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="leaderboard-year">
            Sesong
          </label>
          <div className="relative">
            <select
              id="leaderboard-year"
              className="h-10 appearance-none rounded-full border border-border/60 bg-background px-5 pr-12 text-sm font-medium shadow-xs transition focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              value={year}
              onChange={(event) => setYear(Number.parseInt(event.target.value, 10))}
            >
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
      </div>

      {errorMessage ? (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
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
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
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
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/70 bg-muted/40 px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-12 w-full animate-pulse rounded-2xl bg-muted/60" />
      ))}
    </div>
  );
}
