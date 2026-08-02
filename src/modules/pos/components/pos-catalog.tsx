"use client";

import { Search } from "lucide-react";
import { Input } from "@/design-system/components/input";
import { cn } from "@/modules/shared/lib/cn";
import type { PosCategory, PosVariant } from "@/modules/pos/services/catalog-service";
import { formatMoney } from "@/modules/pos/utils/format";

type PosCatalogProps = {
  categories: PosCategory[];
  variants: PosVariant[];
  categoryId: string | null;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectCategory: (categoryId: string | null) => void;
  onAddVariant: (variant: PosVariant) => void;
};

function variantInitials(label: string) {
  return label
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export function PosCatalog({
  categories,
  variants,
  categoryId,
  search,
  onSearchChange,
  onSelectCategory,
  onAddVariant,
}: PosCatalogProps) {
  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-[var(--color-background)]">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar producto o sabor…"
            className="h-11 pl-10"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className={cn(
            "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            categoryId === null
              ? "bg-[var(--color-accent)] text-white"
              : "bg-[var(--color-surface-elevated)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
          )}
        >
          Todas
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              categoryId === category.id
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-surface-elevated)] text-[var(--color-muted)] hover:text-[var(--color-foreground)]",
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              onClick={() => onAddVariant(variant)}
              className="group overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] text-left shadow-[var(--shadow-sm)] transition-transform hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]"
            >
              <div
                className="relative flex h-28 items-center justify-center"
                style={{
                  backgroundImage:
                    "linear-gradient(135deg, var(--color-card-gradient-from), var(--color-card-gradient-to))",
                }}
              >
                <span className="text-2xl font-bold text-[var(--color-primary)]/80">
                  {variantInitials(variant.label)}
                </span>
                <span className="absolute right-2 bottom-2 rounded-full bg-[var(--color-surface)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)] shadow-[var(--shadow-sm)]">
                  +
                </span>
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-2 min-h-10 text-sm font-medium leading-snug">
                  {variant.label}
                </p>
                <p className="text-base font-bold text-[var(--color-accent)]">
                  {formatMoney(variant.price)}
                </p>
              </div>
            </button>
          ))}
        </div>
        {variants.length === 0 ? (
          <p className="mt-10 text-center text-sm text-[var(--color-muted)]">
            No hay productos en esta categoría.
          </p>
        ) : null}
      </div>
    </section>
  );
}
