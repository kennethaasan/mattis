"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", leadingIcon, ...props }, ref) => {
    return (
      <div
        className={cn(
          "group relative flex items-center rounded-2xl border border-input bg-background text-base shadow-sm transition focus-within:border-primary/60 focus-within:shadow-md",
          className,
        )}
      >
        {leadingIcon ? (
          <span className="pl-4 text-muted-foreground transition group-focus-within:text-primary">
            {leadingIcon}
          </span>
        ) : null}
        <input
          type={type}
          className={cn(
            "flex-1 rounded-2xl bg-transparent px-4 py-3 text-sm transition placeholder:text-muted-foreground focus:outline-none",
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
