"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlayerCreateSchema, type PlayerCreate } from "@/lib/api/schemas";

interface PlayerFormProps {
  readonly onSubmit: (data: PlayerCreate) => void | Promise<void>;
  readonly initialData?: PlayerCreate;
}

export function PlayerForm({ onSubmit, initialData }: PlayerFormProps) {
  const [value, setValue] = useState(initialData?.display_name ?? "");
  const [error, setError] = useState<string | null>(null);
  const trimmedValue = useMemo(() => value.trim(), [value]);

  useEffect(() => {
    if (typeof initialData?.display_name === "string") {
      setValue(initialData.display_name);
    }
  }, [initialData?.display_name]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsed = PlayerCreateSchema.safeParse({ display_name: trimmedValue });
    if (!parsed.success) {
      const firstIssue = parsed.error.issues.at(0);
      setError(firstIssue?.message ?? "Ugyldig visningsnavn.");
      return;
    }

    setError(null);
    await onSubmit(parsed.data);
    setValue("");
  };

  return (
    <form
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      className="flex flex-col gap-4"
    >
      <div className="space-y-2">
        <Label htmlFor="player-display-name">Visningsnavn</Label>
        <Input
          id="player-display-name"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Legg til en ny Mattis-legende"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "player-form-error" : undefined}
        />
      </div>
      {error ? (
        <p id="player-form-error" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={trimmedValue.length === 0}>
        Lagre spiller
      </Button>
    </form>
  );
}
