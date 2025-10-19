import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PageShellProps {
  readonly children: ReactNode;
  readonly className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return (
    <div
      className={cn(
        "container flex flex-col gap-12 py-16",
        className,
      )}
    >
      {children}
    </div>
  );
}
