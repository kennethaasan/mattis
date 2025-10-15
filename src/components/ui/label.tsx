"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, children, ...props }, ref) => (
  /* biome-ignore lint/a11y/noLabelWithoutControl: htmlFor is forwarded by consumers. */
  <label
    ref={ref}
    className={cn(
      "text-foreground text-sm leading-none font-medium tracking-tight",
      className,
    )}
    {...props}
  >
    {children}
  </label>
));
Label.displayName = "Label";
