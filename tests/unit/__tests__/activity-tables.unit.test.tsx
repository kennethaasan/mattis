import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { FettmattisTable } from "@/components/fettmattis-table";
import { RoundsTable } from "@/components/rounds-table";
import type { FettMattis } from "@/lib/api/fettmattis-client";
import type { Round } from "@/lib/api/schemas";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

afterEach(() => {
  cleanup();
});

const DEFAULT_PARTICIPANTS: Round["participants"] = [
  { id: "player-1", display_name: "Nora", active: true },
  { id: "player-2", display_name: "Iben", active: true },
];

function createRound(overrides: Partial<Round> = {}): Round {
  const participants = overrides.participants ?? DEFAULT_PARTICIPANTS;
  const fallbackLoser = participants[0] ?? DEFAULT_PARTICIPANTS[0];
  if (!fallbackLoser) {
    throw new Error("Unable to create round without participants.");
  }

  const loser = overrides.loser ?? fallbackLoser;

  return {
    id: "round-1",
    created_at: new Date().toISOString(),
    participants,
    loser,
    ...overrides,
  } satisfies Round;
}

function createFettMattis(overrides: Partial<FettMattis> = {}): FettMattis {
  const player =
    overrides.player ??
    ({ id: "fett-1", display_name: "Ada", active: true } as FettMattis["player"]);

  return {
    id: "fettmattis-1",
    created_at: new Date().toISOString(),
    player,
    ...overrides,
  } satisfies FettMattis;
}

describe("Activity tables", () => {
  test("T193: rounds table toggles expanded details", async () => {
    const round = createRound({
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      loser: { id: "player-2", display_name: "Iben", active: true },
    });

    render(
      <RoundsTable
        rounds={[round]}
        emptyMessage="Ingen runder er registrert ennå."
      />,
    );

    expect(screen.queryByText("Taper")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Detaljer" }));

    const detailHeading = await screen.findByText("Taper");
    expect(detailHeading).toBeTruthy();
    const detailSection = document.getElementById(
      `round-details-${round.id}`,
    );
    expect(detailSection).toBeTruthy();
    expect(detailSection?.textContent).toContain("Iben");
  });

  test("T193: rounds table enables deletion within 24 hours", async () => {
    const recentRound = createRound({
      id: "recent-round",
      created_at: new Date().toISOString(),
    });
    const onDelete = vi.fn();

    render(
      <RoundsTable
        rounds={[recentRound]}
        onDeleteRound={onDelete}
        emptyMessage="Ingen runder er registrert ennå."
      />,
    );

    const deleteButton = await screen.findByRole("button", { name: "Slett" });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("recent-round");
  });

  test("T193: rounds table hides deletion outside edit window", () => {
    const oldRound = createRound({
      created_at: new Date(Date.now() - DAY_IN_MS * 2).toISOString(),
    });

    render(
      <RoundsTable
        rounds={[oldRound]}
        onDeleteRound={vi.fn()}
        emptyMessage="Ingen runder er registrert ennå."
      />,
    );

    expect(screen.queryByRole("button", { name: "Slett" })).toBeNull();
  });

  test("T193: FettMattis table exposes entry metadata when expanded", async () => {
    const entry = createFettMattis({
      created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    });

    render(<FettmattisTable fettMattis={[entry]} />);

    expect(screen.queryByText("Spillerstatus")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Detaljer" }));

    const statusHeading = await screen.findByText("Spillerstatus");
    expect(statusHeading).toBeTruthy();
    const detailSection = document.getElementById(
      `fettmattis-details-${entry.id}`,
    );
    expect(detailSection).toBeTruthy();
    expect(detailSection?.textContent).toContain("Aktiv");
    expect(detailSection?.textContent).toContain("Endringsvindu");
  });

  test("T193: FettMattis table restricts deletion after 24 hours", () => {
    const staleEntry = createFettMattis({
      created_at: new Date(Date.now() - DAY_IN_MS * 3).toISOString(),
    });

    render(
      <FettmattisTable
        fettMattis={[staleEntry]}
        onDelete={vi.fn()}
        emptyMessage="Ingen FettMattis"
      />,
    );

    expect(screen.queryByRole("button", { name: "Slett" })).toBeNull();
  });

  test("T193: FettMattis table surfaces delete button for recent entries", async () => {
    const recentEntry = createFettMattis({
      id: "recent-fettmattis",
      created_at: new Date().toISOString(),
    });
    const onDelete = vi.fn();

    render(
      <FettmattisTable
        fettMattis={[recentEntry]}
        onDelete={onDelete}
        emptyMessage="Ingen FettMattis"
      />,
    );

    const deleteButton = await screen.findByRole("button", { name: "Slett" });
    fireEvent.click(deleteButton);

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onDelete).toHaveBeenCalledWith("recent-fettmattis");
  });
});
