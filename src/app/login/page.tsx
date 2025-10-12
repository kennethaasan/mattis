"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { createBasicToken } from "@/lib/auth/credentials";

interface LoginResponse {
  user: {
    id: string;
    username: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const { authorization, isReady, login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget =
    nextParam?.startsWith("/") === true ? nextParam : "/rounds";

  useEffect(() => {
    if (isReady && authorization) {
      router.replace(redirectTarget);
    }
  }, [authorization, isReady, redirectTarget, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (!username || !password) {
        throw new Error("Fyll inn både brukernavn og passord.");
      }

      const token = createBasicToken(username, password);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          Authorization: token,
        },
      });

      if (!response.ok) {
        throw new Error("Feil brukernavn eller passord.");
      }

      const payload = (await response.json()) as LoginResponse;
      login({ user: payload.user, token });
      router.replace(redirectTarget);
    } catch (loginError) {
      setIsSubmitting(false);
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Kunne ikke logge inn akkurat nå.",
      );
      return;
    }

    setIsSubmitting(false);
  };

  if (!isReady) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground text-sm">Laster inn…</p>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3">
          <CardTitle>Logg inn</CardTitle>
          <CardDescription>
            Logg inn med administrasjonskontoen for å oppdatere runder og
            spillere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="username">Brukernavn</Label>
              <Input
                id="username"
                name="username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Logger inn…" : "Logg inn"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
