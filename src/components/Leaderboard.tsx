"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type Tab = "regular" | "fettmattis";

export function Leaderboard() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<Tab>("regular");
  const regularQuery = useQuery<RegularLeaderboard, Error>({
    queryKey: ["leaderboard", "regular", year],
    queryFn: () => getRegularLeaderboard(year),
  });

  const fettmattisQuery = useQuery<FettmattisLeaderboard, Error>({
    queryKey: ["leaderboard", "fettmattis", year],
    queryFn: () => getFettmattisLeaderboard(year),
  });

  const regular = regularQuery.data ?? [];
  const fettmattis = fettmattisQuery.data ?? [];
  const isLoading = regularQuery.isLoading || fettmattisQuery.isLoading;
  const isFetching = regularQuery.isFetching || fettmattisQuery.isFetching;
  const errorMessage =
    regularQuery.error?.message ?? fettmattisQuery.error?.message ?? null;

  const yearOptions = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => now - index);
  }, []);

  const renderTable = (tab: Tab) => {
    if (errorMessage) {
      return (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {errorMessage}
        </div>
      );
    }

    if (isLoading || isFetching) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-12 w-full animate-pulse rounded-2xl bg-muted/60"
            />
          ))}
        </div>
      );
    }

    if (tab === "regular") {
      return regular.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Loss %</TableHead>
              <TableHead className="text-right">Losses</TableHead>
              <TableHead className="text-right">Rounds</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regular.map((entry) => (
              <TableRow key={entry.playerId}>
                <TableCell className="font-semibold">#{entry.rank ?? 1}</TableCell>
                <TableCell className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">
                      {entry.playerName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.roundsPlayed} rounds played
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
      ) : (
        <EmptyState message="No rounds recorded yet for this season." />
      );
    }

    return fettmattis.length > 0 ? (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Fettmattis</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fettmattis.map((entry) => (
            <TableRow key={entry.playerId}>
              <TableCell className="font-semibold">#{entry.rank ?? 1}</TableCell>
              <TableCell className="flex items-center gap-3">
                <span className="font-medium text-foreground">
                  {entry.playerName}
                </span>
                <Badge variant="secondary">Fettmattis hero</Badge>
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {entry.fettmattisCount}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    ) : (
      <EmptyState message="No Fettmattis awarded yet this year." />
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col items-start gap-2 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Live rankings
          </div>
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Season overview for {year}
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Loss percentages are recalculated instantly when a round is stored. Fettmattis awards respect the 24-hour revoke policy.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-muted-foreground" htmlFor="leaderboard-year">
            Season
          </label>
          <select
            id="leaderboard-year"
            className="h-9 rounded-full border border-border/60 bg-background px-4 text-sm font-medium shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={year}
            onChange={(event) => setYear(Number.parseInt(event.target.value, 10))}
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as Tab)} className="space-y-6">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="regular">Regular leaderboard</TabsTrigger>
          <TabsTrigger value="fettmattis">Fettmattis awards</TabsTrigger>
        </TabsList>
        <TabsContent value="regular" className="space-y-4">
          {isLoading ? (
            <LoadingNotice />
          ) : null}
          {renderTable("regular")}
        </TabsContent>
        <TabsContent value="fettmattis" className="space-y-4">
          {isLoading ? (
            <LoadingNotice />
          ) : null}
          {renderTable("fettmattis")}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoadingNotice() {
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Updating standings…
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/70 bg-muted/40 px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
