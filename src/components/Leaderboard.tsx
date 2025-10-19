"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChevronDown, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useMemo, useState } from "react";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [scope, setScope] = useState<LeaderboardScope>(() =>
    new Date().getFullYear()
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

  const regularHasError = regularQuery.isError;
  const fettmattisHasError = fettmattisQuery.isError;

  const regular = regularHasError ? [] : regularQuery.data ?? [];
  const fettmattis = fettmattisHasError ? [] : fettmattisQuery.data ?? [];
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
    const uniqueSeasons = Array.from(new Set(seasons)).sort((a, b) => b - a);

    return [
      { value: "all" as const, label: "Alle år" },
      ...uniqueSeasons.map((yearOption) => ({
        value: yearOption,
        label: yearOption.toString(),
      })),
    ];
  }, [availableSeasons, currentYear]);

  let regularContent: ReactNode;
  if (regularHasError) {
    regularContent = (
      <ErrorPanel message="Kunne ikke laste vanlige resultater. Prøv igjen senere." />
    );
  } else if (regularLoading) {
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
      <div className="space-y-4">
        <div className="md:hidden space-y-3">
          {regular.map((entry) => (
            <article
              key={entry.playerId}
              className="border-border/60 bg-card text-card-foreground rounded-3xl border p-4 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                  #{entry.rank}
                </span>
                <Badge
                  variant={entry.lossPercentage < 30 ? "success" : "outline"}
                >
                  {entry.lossPercentage.toFixed(1)}%
                </Badge>
              </div>
              <div className="mt-2">
                <p className="text-lg font-semibold">{entry.playerName}</p>
              </div>
              <dl className="text-muted-foreground mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="space-y-1">
                  <dt className="text-xs font-medium uppercase tracking-[0.2em]">
                    Tap
                  </dt>
                  <dd className="text-foreground text-base font-semibold">
                    {entry.totalLosses}
                  </dd>
                </div>
                <div className="space-y-1">
                  <dt className="text-xs font-medium uppercase tracking-[0.2em]">
                    Runder
                  </dt>
                  <dd className="text-foreground text-base font-semibold">
                    {entry.roundsPlayed}
                  </dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
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
                  <TableCell>
                    <span className="text-foreground font-medium">
                      {entry.playerName}
                    </span>
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
        </div>
      </div>
    );
  }

  let fettmattisContent: ReactNode;
  if (fettmattisHasError) {
    fettmattisContent = (
      <ErrorPanel message="Kunne ikke laste Fettmattis-oversikten. Prøv igjen senere." />
    );
  } else if (fettmattisLoading) {
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
      <div className="space-y-4">
        <div className="md:hidden space-y-3">
          {fettmattis.map((entry) => (
            <article
              key={entry.playerId}
              className="border-border/60 bg-card text-card-foreground rounded-3xl border p-4 shadow-xs"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-[0.2em]">
                  #{entry.rank}
                </span>
                <Badge variant="secondary">Fettmattis-helt</Badge>
              </div>
              <div className="mt-2">
                <p className="text-lg font-semibold">{entry.playerName}</p>
              </div>
              <div className="text-muted-foreground mt-4 text-sm">
                <span className="text-foreground text-base font-semibold">
                  {entry.fettmattisCount}
                </span>{" "}
                tildelinger
              </div>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
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
                  <TableCell>
                    <span className="text-foreground font-medium">
                      {entry.playerName}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-right">
                    {entry.fettmattisCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SectionHeader
          title={`Sesongoversikt for ${isAllTime ? "alle år" : scope}`}
          description="Tap-prosentene oppdateres med én gang en runde lagres. Fettmattis-utdelinger følger 24-timersfristen for tilbakekalling."
          className="gap-2"
          descriptionClassName="max-w-2xl"
        />
        <div className="flex items-center gap-3 self-start md:self-auto">
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

      <div className="md:hidden">
        <Tabs defaultValue="regular" className="w-full">
          <TabsList className="w-full gap-2">
            <TabsTrigger value="regular" className="flex-1">
              Vanlig tabell
            </TabsTrigger>
            <TabsTrigger value="fettmattis" className="flex-1">
              Fettmattis
            </TabsTrigger>
          </TabsList>
          <TabsContent value="regular" className="mt-6">
            <LeaderboardPanel title="Vanlig tabell" loading={regularLoading}>
              {regularContent}
            </LeaderboardPanel>
          </TabsContent>
          <TabsContent value="fettmattis" className="mt-6">
            <LeaderboardPanel
              title="Fettmattis-utdelinger"
              loading={fettmattisLoading}
            >
              {fettmattisContent}
            </LeaderboardPanel>
          </TabsContent>
        </Tabs>
      </div>

      <div className="hidden gap-6 md:grid lg:grid-cols-2">
        <LeaderboardPanel title="Vanlig tabell" loading={regularLoading}>
          {regularContent}
        </LeaderboardPanel>
        <LeaderboardPanel
          title="Fettmattis-utdelinger"
          loading={fettmattisLoading}
        >
          {fettmattisContent}
        </LeaderboardPanel>
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

interface ErrorPanelProps {
  readonly message: string;
}

function ErrorPanel({ message }: ErrorPanelProps) {
  return (
    <div className="border-destructive/40 bg-destructive/10 text-destructive flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed px-6 py-12 text-center">
      <AlertTriangle aria-hidden className="h-5 w-5" />
      <p className="text-sm font-medium">{message}</p>
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

interface LeaderboardPanelProps {
  readonly title: string;
  readonly loading: boolean;
  readonly children: ReactNode;
}

function LeaderboardPanel({ title, loading, children }: LeaderboardPanelProps) {
  return (
    <Card className="border-border/60 overflow-hidden rounded-3xl border">
      <CardHeader className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <CardTitle className="text-lg font-semibold tracking-tight md:text-xl">
          {title}
        </CardTitle>
        {loading ? <LoadingNotice /> : null}
      </CardHeader>
      <CardContent className="px-4 pb-6 sm:px-6">{children}</CardContent>
    </Card>
  );
}
