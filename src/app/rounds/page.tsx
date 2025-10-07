"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, Trophy } from "lucide-react";

import { RoundForm } from "@/components/RoundForm";
import { FettMattisForm } from "@/components/FettMattisForm";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FettMattisCreate, RoundCreate } from "@/lib/api/schemas";

const DEFAULT_USER_ID =
  process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? "00000000-0000-7000-0000-000000000000";

interface ApiPlayer {
  id: string;
  display_name: string;
  active: boolean;
}

export default function RoundsPage() {
  const [players, setPlayers] = useState<ApiPlayer[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPlayers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/players", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch players");
      }
      const data = (await response.json()) as ApiPlayer[];
      setPlayers(data);
    } catch (error) {
      setError("Unable to load players for the round form.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const hydratablePlayers = useMemo(
    () =>
      players.map((player) => ({
        id: player.id,
        displayName: player.display_name,
        active: player.active,
      })),
    [players],
  );

  const handleRoundSubmit = async (data: RoundCreate) => {
    try {
      setStatus(null);
      setError(null);
      const response = await fetch("/api/rounds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": DEFAULT_USER_ID,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const payload = await response.json();
        const detail = payload?.detail ?? payload?.error?.[0]?.message;
        throw new Error(detail ?? "Unable to save round.");
      }

      setStatus("Round recorded. Leaderboards just updated!");
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save the round. Please retry.",
      );
    }
  };

  const handleFettMattisSubmit = async (data: FettMattisCreate) => {
    try {
      setStatus(null);
      setError(null);
      const response = await fetch("/api/fettmattis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": DEFAULT_USER_ID,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const payload = await response.json();
        const detail = payload?.detail ?? payload?.error?.[0]?.message;
        throw new Error(detail ?? "Unable to grant a FettMattis.");
      }

      setStatus("FettMattis granted. Time to celebrate!");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to grant the FettMattis. Please try again.",
      );
    }
  };

  return (
    <div className="container space-y-10 pb-16 pt-12">
      <div className="flex flex-col gap-2 text-left">
        <Badge variant="outline" className="w-fit border-primary/40 text-primary">
          Round control centre
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Log rounds & FettMattis moments
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Record the players, lock in the loser and celebrate FettMattis recognitions – all from a single hub.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Record a round
            </CardTitle>
            <CardDescription>
              Pick at least two players and mark the unlucky loser. Stats update instantly after saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 w-full animate-pulse rounded-2xl bg-muted/50"
                  />
                ))}
              </div>
            ) : (
              <RoundForm onSubmit={handleRoundSubmit} players={hydratablePlayers} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Grant a FettMattis
            </CardTitle>
            <CardDescription>
              Optional round links keep history aligned with your audit trail.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-11 w-full animate-pulse rounded-2xl bg-muted/50"
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

      {status ? <p className="text-sm text-primary">{status}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-border/70 bg-muted/30 px-4 py-5 text-xs text-muted-foreground">
        <span>
          Changes are editable for 24 hours – after that the record is locked to protect the competition.
        </span>
        <Button variant="ghost" size="sm" onClick={() => fetchPlayers()} disabled={isLoading}>
          Refresh roster
        </Button>
      </div>
    </div>
  );
}
