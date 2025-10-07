
"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getRegularLeaderboard, getFettmattisLeaderboard } from "@/lib/leaderboard";
import { RegularLeaderboard, FettmattisLeaderboard } from "@/lib/leaderboard-types";

export function Leaderboard() {
  const [regularLeaderboard, setRegularLeaderboard] = useState<RegularLeaderboard>([]);
  const [fettmattisLeaderboard, setFettmattisLeaderboard] = useState<FettmattisLeaderboard>([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchData() {
      const [regular, fettmattis] = await Promise.all([
        getRegularLeaderboard(year),
        getFettmattisLeaderboard(year),
      ]);
      setRegularLeaderboard(regular);
      setFettmattisLeaderboard(fettmattis);
    }
    fetchData();
  }, [year]);

  return (
    <div>
      <div className="flex justify-end mb-4">
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      <Tabs defaultValue="regular">
        <TabsList>
          <TabsTrigger value="regular">Regular</TabsTrigger>
          <TabsTrigger value="fettmattis">Fettmattis</TabsTrigger>
        </TabsList>
        <TabsContent value="regular">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Losses</TableHead>
                <TableHead>Rounds Played</TableHead>
                <TableHead>Loss Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regularLeaderboard.map((player) => (
                <TableRow key={player.playerId}>
                  <TableCell>{player.playerName}</TableCell>
                  <TableCell>{player.totalLosses}</TableCell>
                  <TableCell>{player.roundsPlayed}</TableCell>
                  <TableCell>{player.lossPercentage.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="fettmattis">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Player</TableHead>
                <TableHead>Fettmattis Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fettmattisLeaderboard.map((player) => (
                <TableRow key={player.playerId}>
                  <TableCell>{player.playerName}</TableCell>
                  <TableCell>{player.fettmattisCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}
