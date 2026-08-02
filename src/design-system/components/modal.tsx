"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/modules/shared/lib/cn";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
} & HTMLAttributes<HTMLDivElement>;

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  className,
  ...props
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-lg rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)]",
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        {...props}
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            Cerrar
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-[var(--color-border)] px-5 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
