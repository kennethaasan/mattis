"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { ArrowRight, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";

const navLinks = [
  { href: "/", label: "Oversikt" },
  { href: "/leaderboard", label: "Tabeller" },
  { href: "/players", label: "Spillere" },
  { href: "/rounds", label: "Runder" },
] as const satisfies readonly { href: Route; label: string }[];

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-3">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
            aria-label="Mattis forside"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40">
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
                      ? "bg-primary/10 text-primary shadow-xs shadow-primary/10"
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
          <ModeToggle />
          <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="https://mattis.vanvikil.no/" target="_blank" rel="noreferrer">
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
            aria-controls="mobile-nav"
            aria-label="Vis eller skjul meny"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div
        id="mobile-nav"
        className={cn(
          "md:hidden",
          isMenuOpen ? "block border-t border-border/60 bg-background/95 backdrop-blur-xl" : "hidden",
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
                    ? "bg-primary/10 text-primary shadow-xs shadow-primary/20"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <Button variant="outline" className="w-full" asChild>
            <Link href="https://mattis.vanvikil.no/" target="_blank" rel="noreferrer">
              Klassisk app
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
