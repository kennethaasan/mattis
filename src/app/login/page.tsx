"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, loading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  useEffect(() => {
    if (user) {
      router.replace("/rounds");
    }
  }, [router, user]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);
      setIsSubmitting(true);

      try {
        await login({ email, password });
        router.replace("/rounds");
      } catch (loginError) {
        const message =
          loginError instanceof Error ? loginError.message : "Kunne ikke logge inn.";
        setFormError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, login, password, router],
  );

  const submitDisabled = loading || isSubmitting || email.length === 0 || password.length === 0;

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-16">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/60 bg-background/60 p-8 shadow-lg backdrop-blur">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold">Logg inn</h1>
          <p className="text-muted-foreground text-sm">
            Skriv inn e-postadresse og passord for å få tilgang til administrasjonen.
          </p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2 text-left">
            <Label htmlFor={emailId}>E-post</Label>
            <Input
              id={emailId}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2 text-left">
            <Label htmlFor={passwordId}>Passord</Label>
            <Input
              id={passwordId}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {(formError || error) && (
            <p className="text-destructive text-sm" role="alert">
              {formError ?? error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitDisabled}>
            {isSubmitting ? "Logger inn…" : "Logg inn"}
          </Button>
        </form>
      </div>
    </div>
  );
}
