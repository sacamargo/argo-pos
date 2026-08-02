import { useMemo, useState } from "react";
import type { PaymentMethod, SaleWithItems } from "@/domain/entities/sale";
import type { Cart } from "@/domain/services/cart";
import { cartTotalCents } from "@/domain/services/cart";
import { Button, Input, Modal } from "@/components";
import { centsToPesos, formatPesos, pesosToCents } from "@/shared/utils/money";
import { cn } from "@/shared/lib/cn";

const QUICK_AMOUNTS = [1_000, 2_000, 5_000, 10_000, 20_000, 50_000];

type PaymentModalProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  cart: Cart;
  methods: PaymentMethod[];
  onClose: () => void;
  onConfirm: (paymentMethodId: string, amountTenderedCents: number | null) => void;
};

export function PaymentModal({
  open,
  busy,
  error,
  cart,
  methods,
  onClose,
  onConfirm,
}: PaymentModalProps) {
  const total = cartTotalCents(cart);
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const [tenderedPesos, setTenderedPesos] = useState("");

  const selected = methods.find((method) => method.id === methodId) ?? methods[0];
  const isCash = selected?.code === "cash";

  const tenderedCents = useMemo(() => {
    if (tenderedPesos === "") {
      return null;
    }
    const pesos = Number(tenderedPesos);
    if (Number.isNaN(pesos) || pesos < 0) {
      return null;
    }
    return pesosToCents(pesos);
  }, [tenderedPesos]);

  const changeCents =
    isCash && tenderedCents !== null ? tenderedCents - total : null;

  const canConfirm =
    Boolean(selected) &&
    (!isCash || (tenderedCents !== null && tenderedCents >= total));

  return (
    <Modal
      open={open}
      title="Cobrar"
      description={`Total ${formatPesos(total)}`}
      onClose={onClose}
      className="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {methods.map((method) => (
            <Button
              key={method.id}
              type="button"
              variant={method.id === selected?.id ? "default" : "outline"}
              onClick={() => setMethodId(method.id)}
              disabled={busy}
            >
              {method.name}
            </Button>
          ))}
        </div>

        {isCash ? (
          <div className="space-y-3">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">Recibido (COP)</span>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={tenderedPesos}
                onChange={(event) => setTenderedPesos(event.target.value)}
                disabled={busy}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => setTenderedPesos(String(centsToPesos(total)))}
              >
                Exacto
              </Button>
              {QUICK_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  onClick={() =>
                    setTenderedPesos(String((Number(tenderedPesos) || 0) + amount))
                  }
                >
                  +{amount.toLocaleString("es-CO")}
                </Button>
              ))}
            </div>
            <p
              className={cn(
                "text-sm",
                changeCents !== null && changeCents < 0
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              Cambio:{" "}
              <span className="font-semibold text-foreground">
                {changeCents === null
                  ? "—"
                  : changeCents < 0
                    ? "Insuficiente"
                    : formatPesos(changeCents)}
              </span>
            </p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button
            size="lg"
            disabled={busy || !canConfirm}
            onClick={() =>
              selected &&
              onConfirm(selected.id, isCash ? tenderedCents : null)
            }
          >
            {busy ? "Procesando…" : "Confirmar cobro"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

type SaleSuccessModalProps = {
  sale: SaleWithItems | null;
  onClose: () => void;
};

export function SaleSuccessModal({ sale, onClose }: SaleSuccessModalProps) {
  if (!sale) {
    return null;
  }

  return (
    <Modal
      open
      title="Venta registrada"
      description={`Ticket ${sale.id.slice(0, 8).toUpperCase()}`}
      onClose={onClose}
    >
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Total</span>
          <span className="font-semibold">{formatPesos(sale.totalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pago</span>
          <span>{sale.paymentMethodName}</span>
        </div>
        {sale.changeCents !== null ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cambio</span>
            <span className="font-semibold">{formatPesos(sale.changeCents)}</span>
          </div>
        ) : null}
        <Button className="w-full" size="lg" onClick={onClose}>
          Nueva venta
        </Button>
      </div>
    </Modal>
  );
}
