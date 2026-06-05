"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface ToggleGroupProps<T extends string> {
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: ToggleGroupProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-lg border border-[var(--color-ink-muted)] p-0.5",
        "dark:bg-transparent",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md font-medium transition-all duration-fast",
            "text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark)]",
            "light:text-[var(--color-ink-faint)] light:hover:text-[var(--color-ink)]",
            value === opt.value &&
              "bg-[var(--color-surface-dark)] text-[var(--color-primary-light)] shadow-sm",
            value === opt.value &&
              "light:bg-[var(--color-canvas)] light:text-[var(--color-primary)]",
            size === "sm" ? "px-2 py-1 text-micro" : "px-3 py-1.5 text-caption"
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export { ToggleGroup };
export type { ToggleOption, ToggleGroupProps };
