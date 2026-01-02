import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, test, vi } from "vitest";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

const mockUsePathname = vi.fn();
const mockUseRouter = vi.fn();
const mockUseAuth = vi.fn();

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => mockUseRouter(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/components/mode-toggle", () => ({
  ModeToggle: () => <div data-testid="mode-toggle" />,
}));

afterEach(() => {
  cleanup();
});

describe("SiteHeader", () => {
  test("renders login button when logged out", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      logout: vi.fn(),
      loading: false,
    });
    mockUsePathname.mockReturnValue("/");
    mockUseRouter.mockReturnValue({ push: vi.fn() });

    render(<SiteHeader />);

    expect(screen.getAllByText("Logg inn").length).toBeGreaterThan(0);
    expect(screen.queryByText("Logg ut")).toBeNull();

    const menuButton = screen.getByRole("button", {
      name: "Vis eller skjul meny",
    });
    fireEvent.click(menuButton);

    expect(screen.getAllByText("Tabeller").length).toBeGreaterThan(0);
  });

  test("logs out and redirects when logged in", async () => {
    const logout = vi.fn().mockResolvedValue(undefined);
    const push = vi.fn();

    mockUseAuth.mockReturnValue({
      user: { id: "user-1", email: "a@a.no", name: "Ada" },
      logout,
      loading: false,
    });
    mockUsePathname.mockReturnValue("/players");
    mockUseRouter.mockReturnValue({ push });

    render(<SiteHeader />);

    const logoutButton = screen.getAllByRole("button", { name: "Logg ut" })[0];
    if (!logoutButton) {
      throw new Error("Expected logout button");
    }
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(logout).toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith("/login");
    });
  });
});

describe("SiteFooter", () => {
  test("renders footer links", () => {
    render(<SiteFooter />);

    expect(screen.getByText("Historisk referanse")).toBeTruthy();
    expect(screen.getByText("Prosjektrepo")).toBeTruthy();
  });
});
