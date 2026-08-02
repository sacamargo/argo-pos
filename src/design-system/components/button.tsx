import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/modules/shared/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90",
        secondary:
          "bg-[var(--color-surface-elevated)] text-[var(--color-foreground)] border border-[var(--color-border)] hover:bg-[var(--color-border)]/40",
        accent:
          "bg-[var(--color-accent)] text-white hover:opacity-90",
        danger:
          "bg-[var(--color-danger)] text-white hover:opacity-90",
        ghost: "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]",
      },
      size: {
        sm: "h-9 rounded-[var(--radius-md)] px-3 text-sm",
        md: "h-11 rounded-[var(--radius-md)] px-4 text-sm",
        lg: "h-14 rounded-[var(--radius-lg)] px-6 text-base",
        xl: "h-16 rounded-[var(--radius-lg)] px-8 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
