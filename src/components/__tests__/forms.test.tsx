import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { FettmattisForm } from "@/components/FettmattisForm";
import { PlayerForm } from "@/components/PlayerForm";
import { RoundForm } from "@/components/RoundForm";

const PLAYERS = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    displayName: "Ada",
    active: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    displayName: "Nils",
    active: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    displayName: "Iben",
    active: true,
  },
];
const [FIRST_PLAYER, SECOND_PLAYER] = PLAYERS;
if (!FIRST_PLAYER || !SECOND_PLAYER) {
  throw new Error("Expected at least two players");
}

afterEach(() => {
  cleanup();
});

describe("PlayerForm", () => {
  test("submits trimmed value and clears input", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<PlayerForm onSubmit={onSubmit} />);

    const input = screen.getByLabelText("Visningsnavn") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "  Ada  " } });

    fireEvent.submit(input.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ display_name: "Ada" });
    });

    expect(input.value).toBe("");
  });

  test("shows validation error for empty input", async () => {
    const onSubmit = vi.fn();

    render(<PlayerForm onSubmit={onSubmit} />);

    const input = screen.getByLabelText("Visningsnavn") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "   " } });

    fireEvent.submit(input.closest("form") as HTMLFormElement);

    expect(
      await screen.findByText("Display name cannot be empty."),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("RoundForm", () => {
  test("submits selected participants and loser", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<RoundForm onSubmit={onSubmit} players={PLAYERS} />);

    fireEvent.click(screen.getByRole("button", { name: /Ada/ }));
    fireEvent.click(screen.getByRole("button", { name: /Nils/ }));

    const select = screen.getByLabelText("Taper") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: FIRST_PLAYER.id } });

    fireEvent.submit(select.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        participant_ids: [FIRST_PLAYER.id, SECOND_PLAYER.id],
        loser_id: FIRST_PLAYER.id,
      });
    });
  });

  test("shows validation error when participants are missing", async () => {
    const onSubmit = vi.fn();

    render(<RoundForm onSubmit={onSubmit} players={PLAYERS} />);

    const select = screen.getByLabelText("Taper") as HTMLSelectElement;
    fireEvent.submit(select.closest("form") as HTMLFormElement);

    expect(
      await screen.findByText(
        /Must be a valid UUID|A round must have at least two participants|Kunne ikke lagre runden/,
      ),
    ).toBeTruthy();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe("FettmattisForm", () => {
  test("submits selected player", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <FettmattisForm onSubmit={onSubmit} players={PLAYERS} rounds={[]} />,
    );

    const select = screen.getByLabelText("Spiller") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: SECOND_PLAYER.id } });
    fireEvent.submit(select.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({ player_id: SECOND_PLAYER.id });
    });
  });

  test("resets invalid initial player selection", async () => {
    render(
      <FettmattisForm
        onSubmit={vi.fn()}
        players={PLAYERS}
        rounds={[]}
        initialData={{ player_id: "missing" }}
      />,
    );

    const select = screen.getByLabelText("Spiller") as HTMLSelectElement;

    await waitFor(() => {
      expect(select.value).toBe("");
    });
  });
});
