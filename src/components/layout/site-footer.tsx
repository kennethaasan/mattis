"use client";

import { ExternalLink, Heart } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface SiteFooterProps {
  readonly className?: string;
}

export function SiteFooter({ className }: SiteFooterProps) {
  return (
    <footer
      className={cn(
        "border-border/60 bg-background/70 border-t backdrop-blur-md",
        className,
      )}
    >
      <div className="text-muted-foreground container flex flex-col items-center justify-between gap-4 py-8 text-sm md:flex-row">
        <p className="flex items-center gap-1 text-sm">
          Bygget med lidenskap for Mattis-miljøet
          <Heart className="h-4 w-4 fill-current text-rose-500" />
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="https://mattis.vanvikil.no/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary transition"
          >
            Historisk referanse
          </Link>
          <Link
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary flex items-center gap-2 transition"
          >
            <ExternalLink className="h-4 w-4" />
            Prosjektrepo
          </Link>
        </div>
      </div>
    </footer>
  );
}
