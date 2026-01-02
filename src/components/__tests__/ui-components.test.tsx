import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { PageShell } from "@/components/layout/page-shell";
import { ModeToggle } from "@/components/mode-toggle";
import { QueryProvider } from "@/components/query-provider";
import { SectionHeader } from "@/components/section-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const { mockUseTheme } = vi.hoisted(() => ({
  mockUseTheme: vi.fn(),
}));

vi.mock("next-themes", () => ({
  ThemeProvider: ({ children, ...props }: { children: ReactNode }) => (
    <div data-testid="theme-provider" data-props={JSON.stringify(props)}>
      {children}
    </div>
  ),
  useTheme: mockUseTheme,
}));

afterEach(() => {
  cleanup();
});

describe("ui components", () => {
  test("Input renders with leading icon", () => {
    render(
      <Input
        leadingIcon={<span data-testid="leading">Icon</span>}
        placeholder="Navn"
      />,
    );

    expect(screen.getByTestId("leading")).toBeTruthy();
    expect(screen.getByPlaceholderText("Navn")).toBeTruthy();
  });

  test("Label renders children", () => {
    render(<Label>Visningsnavn</Label>);

    expect(screen.getByText("Visningsnavn")).toBeTruthy();
  });

  test("SectionHeader renders badge, title and description", () => {
    render(
      <SectionHeader
        badge={<span>Badge</span>}
        title="Tittel"
        description="Beskrivelse"
        titleAs="h3"
        align="center"
      />,
    );

    expect(screen.getByText("Badge")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3 }).textContent).toBe(
      "Tittel",
    );
    expect(screen.getByText("Beskrivelse")).toBeTruthy();
  });

  test("PageShell wraps children", () => {
    render(
      <PageShell className="test-shell">
        <span>Innhold</span>
      </PageShell>,
    );

    expect(screen.getByText("Innhold")).toBeTruthy();
  });

  test("ThemeProvider forwards props to next-themes provider", () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="system">
        <span>Child</span>
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme-provider")).toBeTruthy();
    expect(screen.getByText("Child")).toBeTruthy();
  });

  test("QueryProvider renders children", () => {
    render(
      <QueryProvider>
        <span>Query child</span>
      </QueryProvider>,
    );

    expect(screen.getByText("Query child")).toBeTruthy();
  });

  test("ModeToggle toggles theme after mount", async () => {
    const setTheme = vi.fn();
    mockUseTheme.mockReturnValue({
      theme: "system",
      systemTheme: "dark",
      setTheme,
    });

    render(<ModeToggle />);

    const button = screen.getByRole("button", {
      name: "Bytt tema",
    }) as HTMLButtonElement;

    await waitFor(() => {
      expect(button.disabled).toBe(false);
    });

    fireEvent.click(button);

    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
