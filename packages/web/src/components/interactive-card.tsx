"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  hoverEffect?: "glow" | "lift" | "border";
}

export function InteractiveCard({
  children,
  className,
  onClick,
  selected = false,
  hoverEffect = "lift",
}: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "rounded-xl border transition-all duration-normal cursor-pointer",
        "border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]",
        onClick && "cursor-pointer",
        selected && "border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]",
        hoverEffect === "glow" &&
          isHovered &&
          "border-[var(--color-primary)]/50 shadow-[0_0_20px_rgba(99,102,241,0.15)]",
        hoverEffect === "lift" && isHovered && "-translate-y-0.5 shadow-lg",
        hoverEffect === "border" &&
          isHovered &&
          "border-[var(--color-ink-soft)]",
        !isHovered && "shadow-none",
        className
      )}
    >
      {children}
    </div>
  );
}
