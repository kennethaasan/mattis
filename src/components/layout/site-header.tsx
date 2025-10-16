"use client";

import { ArrowRight, Menu } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Oversikt" },
  { href: "/leaderboard", label: "Tabeller" },
  { href: "/players", label: "Spillere" },
  { href: "/rounds", label: "Runder" },
] as const satisfies readonly { href: Route; label: string }[];

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const mobileNavId = React.useId();
  const { user, logout, loading } = useAuth();

  React.useEffect(() => {
    if (!pathname) {
      return;
    }
    setIsMenuOpen(false);
  }, [pathname]);

  const handleLogout = React.useCallback(async () => {
    await logout();
    router.push("/login");
  }, [logout, router]);

  return (
    <header className="border-border/60 bg-background/75 sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
            aria-label="Mattis forside"
          >
            <span className="bg-primary text-primary-foreground shadow-primary/40 grid h-9 w-9 place-items-center rounded-full shadow-lg">
              M
            </span>
            <span className="hidden sm:inline-flex">Mattis</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === link.href
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-primary/10 text-primary shadow-primary/10 shadow-xs"
                      : "text-muted-foreground hover:bg-muted/60",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                void handleLogout();
              }}
              disabled={loading}
              className="hidden sm:inline-flex"
            >
              Logg ut
            </Button>
          ) : (
            <Button variant="default" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/login">Logg inn</Link>
            </Button>
          )}
          <ModeToggle />
          <Button
            variant="outline"
            size="sm"
            asChild
            className="hidden sm:inline-flex"
          >
            <Link
              href="https://mattis.vanvikil.no/"
              target="_blank"
              rel="noreferrer"
            >
              Klassisk app
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-expanded={isMenuOpen}
            aria-controls={mobileNavId}
            aria-label="Vis eller skjul meny"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div
        id={mobileNavId}
        className={cn(
          "md:hidden",
          isMenuOpen
            ? "border-border/60 bg-background/95 block border-t backdrop-blur-xl"
            : "hidden",
        )}
      >
        <nav className="container flex flex-col gap-2 py-4">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === link.href
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-primary/10 text-primary shadow-primary/20 shadow-xs"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          {user ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                void handleLogout();
              }}
              disabled={loading}
            >
              Logg ut
            </Button>
          ) : (
            <Button variant="outline" className="w-full" asChild>
              <Link href="/login">Logg inn</Link>
            </Button>
          )}
          <Button variant="outline" className="w-full" asChild>
            <Link
              href="https://mattis.vanvikil.no/"
              target="_blank"
              rel="noreferrer"
            >
              Klassisk app
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
