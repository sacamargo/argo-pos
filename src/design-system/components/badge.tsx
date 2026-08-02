import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/modules/shared/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-slate-100 text-slate-700",
        success: "bg-[var(--color-success-muted)] text-[var(--color-success)]",
        warning: "bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
        danger: "bg-[var(--color-danger-muted)] text-[var(--color-danger)]",
        accent: "bg-[var(--color-accent-muted)] text-[var(--color-accent)]",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
