import type { HTMLAttributes } from "react";
import { cn } from "@/modules/shared/lib/cn";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]",
        className,
      )}
      {...props}
    />
  );
}
