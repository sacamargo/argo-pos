import type { HTMLAttributes, TableHTMLAttributes } from "react";
import { cn } from "@/modules/shared/lib/cn";

export function Table({
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-left text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function THead(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className="border-b border-[var(--color-border)]" {...props} />;
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TR({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("border-b border-[var(--color-border)] last:border-0", className)}
      {...props}
    />
  );
}

export function TH({
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "px-3 py-2 font-medium text-[var(--color-muted)]",
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  ...props
}: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn("px-3 py-3 text-[var(--color-foreground)]", className)}
      {...props}
    />
  );
}
