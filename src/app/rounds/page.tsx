
"use client";

import { useEffect, useState } from "react";
import { RoundForm } from "@/components/RoundForm";
import { Player } from "@/lib/db/schema";
import { RoundCreate } from "@/lib/api/schemas";

export default function RoundsPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  async function fetchPlayers() {
    const res = await fetch("/api/players");
    const data = await res.json();
    setPlayers(data);
  }

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function handleRoundSubmit(data: RoundCreate) {
    await fetch("/api/rounds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    // Optionally, redirect or show a success message
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Round Management</h1>
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-3">Create Round</h2>
        <RoundForm players={players} onSubmit={handleRoundSubmit} />
      </div>
    </div>
  );
}
