"use client";

import { Minus, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/design-system/components/button";
import type { CartLine } from "@/modules/pos/machine/pos-machine";
import { formatMoney } from "@/modules/pos/utils/format";

type PosCartProps = {
  cart: CartLine[];
  total: number;
  itemCount: number;
  onChangeQty: (variantId: string, quantity: number) => void;
  onRemove: (variantId: string) => void;
  onClear: () => void;
  onPay: () => void;
};

export function PosCart({
  cart,
  total,
  itemCount,
  onChangeQty,
  onRemove,
  onClear,
  onPay,
}: PosCartProps) {
  return (
    <aside className="flex h-full w-full max-w-[380px] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <p className="text-xs text-[var(--color-muted)]">Orden actual</p>
          <h2 className="text-lg font-semibold">#{itemCount || 0}</h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-9 rounded-full p-0 text-[var(--color-danger)]"
          onClick={onClear}
          aria-label="Vaciar carrito"
          disabled={cart.length === 0}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="flex h-full min-h-[180px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-4 text-center text-sm text-[var(--color-muted)]">
            Toca un producto para agregarlo a la orden.
          </div>
        ) : (
          cart.map((line) => (
            <div
              key={line.variantId}
              className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium">{line.label}</p>
                  <p className="text-sm text-[var(--color-muted)]">
                    {formatMoney(line.unitPrice)}
                  </p>
                </div>
                <button
                  type="button"
                  className="text-[var(--color-muted)] hover:text-[var(--color-danger)]"
                  onClick={() => onRemove(line.variantId)}
                  aria-label="Quitar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]"
                    onClick={() => onChangeQty(line.variantId, line.quantity - 1)}
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-8 text-center text-sm font-semibold">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]"
                    onClick={() => onChangeQty(line.variantId, line.quantity + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-semibold">
                  {formatMoney(line.unitPrice * line.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3 border-t border-[var(--color-border)] p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--color-muted)]">
            Total ({itemCount} {itemCount === 1 ? "ítem" : "ítems"})
          </span>
          <span className="text-xl font-bold">{formatMoney(total)}</span>
        </div>
        <Button
          type="button"
          size="xl"
          className="w-full bg-[var(--color-accent)] hover:opacity-90"
          disabled={cart.length === 0}
          onClick={onPay}
        >
          Cobrar ahora
        </Button>
      </div>
    </aside>
  );
}
