import { Minus, Plus, Trash2 } from "lucide-react";
import type { Cart } from "@/domain/services/cart";
import { cartSubtotalCents, cartTotalCents, lineTotalCents } from "@/domain/services/cart";
import { Button, Input } from "@/components";
import { centsToPesos, formatPesos, pesosToCents } from "@/shared/utils/money";

type PosCartProps = {
  cart: Cart;
  busy: boolean;
  onIncrement: (productId: string) => void;
  onDecrement: (productId: string) => void;
  onRemove: (productId: string) => void;
  onDiscountChange: (discountCents: number) => void;
  onPay: () => void;
};

export function PosCart({
  cart,
  busy,
  onIncrement,
  onDecrement,
  onRemove,
  onDiscountChange,
  onPay,
}: PosCartProps) {
  const subtotal = cartSubtotalCents(cart);
  const total = cartTotalCents(cart);

  return (
    <aside className="flex h-full min-h-0 w-80 shrink-0 flex-col border-l border-border pl-3">
      <h2 className="mb-3 text-lg font-semibold">Carrito</h2>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto">
        {cart.lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Toca un producto para agregarlo.</p>
        ) : (
          cart.lines.map((line) => (
            <div
              key={line.productId}
              className="rounded-md border border-border bg-card p-3"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{line.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatPesos(line.unitPriceCents)} c/u
                  </p>
                </div>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onRemove(line.productId)}
                  aria-label={`Quitar ${line.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-9"
                    onClick={() => onDecrement(line.productId)}
                    aria-label="Menos"
                  >
                    <Minus />
                  </Button>
                  <span className="min-w-8 text-center text-sm font-semibold">
                    {line.quantity}
                  </span>
                  <Button
                    size="icon"
                    variant="outline"
                    className="size-9"
                    onClick={() => onIncrement(line.productId)}
                    aria-label="Más"
                  >
                    <Plus />
                  </Button>
                </div>
                <span className="text-sm font-semibold">
                  {formatPesos(lineTotalCents(line))}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 space-y-3 border-t border-border pt-3">
        <label className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">Descuento (COP)</span>
          <Input
            className="h-9 w-28"
            type="number"
            min={0}
            inputMode="numeric"
            value={centsToPesos(cart.discountCents)}
            onChange={(event) => {
              const pesos = Number(event.target.value);
              onDiscountChange(Number.isNaN(pesos) ? 0 : pesosToCents(pesos));
            }}
          />
        </label>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPesos(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Descuento</span>
            <span>-{formatPesos(cart.discountCents)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>{formatPesos(total)}</span>
          </div>
        </div>
        <Button
          size="lg"
          className="w-full text-base"
          disabled={busy || cart.lines.length === 0}
          onClick={onPay}
        >
          Cobrar
        </Button>
      </div>
    </aside>
  );
}
