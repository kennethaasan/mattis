
"use client";

import { useEffect, useState } from "react";
import { PlayerForm } from "@/components/PlayerForm";
import { Player } from "@/lib/db/schema";
import { PlayerCreate } from "@/lib/api/schemas";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);

  async function fetchPlayers() {
    const res = await fetch("/api/players");
    const data = await res.json();
    setPlayers(data);
  }

  useEffect(() => {
    fetchPlayers();
  }, []);

  async function handlePlayerSubmit(data: PlayerCreate) {
    await fetch("/api/players", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    fetchPlayers();
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-5">Player Management</h1>
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-3">Create Player</h2>
        <PlayerForm onSubmit={handlePlayerSubmit} />
      </div>
      <div>
        <h2 className="text-2xl font-bold mb-3">Players</h2>
        <ul>
          {players.map((player) => (
            <li key={player.id}>{player.displayName}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
