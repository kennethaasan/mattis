"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leadingIcon, ...props }, ref) => {
    return (
      <div
        className={cn(
          "group border-input bg-background focus-within:border-primary/60 relative flex items-center rounded-2xl border text-base shadow-xs transition focus-within:shadow-md",
          className,
        )}
      >
        {leadingIcon ? (
          <span className="text-muted-foreground group-focus-within:text-primary pl-4 transition">
            {leadingIcon}
          </span>
        ) : null}
        <input
          type={type}
          className={cn(
            "placeholder:text-muted-foreground flex-1 rounded-2xl bg-transparent px-4 py-3 text-sm transition focus:outline-hidden",
            leadingIcon ? "pl-3" : "pl-4",
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";
