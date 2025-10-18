import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  readonly badge?: ReactNode;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly align?: "left" | "center";
  readonly className?: string;
  readonly descriptionClassName?: string;
  readonly titleAs?: keyof JSX.IntrinsicElements;
}

export function SectionHeader({
  badge,
  title,
  description,
  align = "left",
  className,
  descriptionClassName,
  titleAs = "h2",
}: SectionHeaderProps) {
  const HeadingTag = titleAs;

  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "text-left",
        className,
      )}
    >
      {badge ? (
        <div className={cn("w-fit", align === "center" ? "mx-auto" : undefined)}>
          {badge}
        </div>
      ) : null}
      <div className="space-y-2">
        <HeadingTag className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </HeadingTag>
        {description ? (
          <p
            className={cn(
              "text-muted-foreground text-sm sm:text-base",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
