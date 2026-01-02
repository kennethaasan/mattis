import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";

import RootLayout from "@/app/layout";

vi.mock("@/components/layout/site-header", () => ({
  SiteHeader: () => <div data-testid="site-header" />,
}));

vi.mock("@/components/layout/site-footer", () => ({
  SiteFooter: () => <div data-testid="site-footer" />,
}));

vi.mock("@/components/query-provider", () => ({
  QueryProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="query-provider">{children}</div>
  ),
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="theme-provider">{children}</div>
  ),
}));

vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

describe("RootLayout", () => {
  test("renders core layout wrappers", () => {
    render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>,
    );

    expect(screen.getByTestId("theme-provider")).toBeTruthy();
    expect(screen.getByTestId("query-provider")).toBeTruthy();
    expect(screen.getByTestId("auth-provider")).toBeTruthy();
    expect(screen.getByTestId("site-header")).toBeTruthy();
    expect(screen.getByTestId("site-footer")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
  });
});
