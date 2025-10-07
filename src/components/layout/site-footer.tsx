"use client";

import Link from "next/link";
import { Github, Heart } from "lucide-react";

import { cn } from "@/lib/utils";

export function SiteFooter({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "border-t border-border/60 bg-background/70 backdrop-blur-md",
        className,
      )}
    >
      <div className="container flex flex-col items-center justify-between gap-4 py-8 text-sm text-muted-foreground md:flex-row">
        <p className="flex items-center gap-1 text-sm">
          Built with passion for the Mattis community
          <Heart className="h-4 w-4 fill-current text-rose-500" />
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="https://mattis.vanvikil.no/"
            target="_blank"
            rel="noreferrer"
            className="transition hover:text-primary"
          >
            Legacy reference
          </Link>
          <Link
            href="https://github.com/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 transition hover:text-primary"
          >
            <Github className="h-4 w-4" />
            Project Repo
          </Link>
        </div>
      </div>
    </footer>
  );
}
