"use client";

import { Button } from "@/design-system/components/button";
import { Input } from "@/design-system/components/input";
import { Modal } from "@/design-system/components/modal";
import type { PosPaymentMethod } from "@/modules/pos/services/catalog-service";
import { formatMoney } from "@/modules/pos/utils/format";

const QUICK_ADD = [1000, 2000, 5000, 10000, 20000, 50000] as const;

type PaymentModalProps = {
  open: boolean;
  pending: boolean;
  total: number;
  paymentMethods: PosPaymentMethod[];
  paymentMethodId: string | null;
  amountTendered: string;
  onClose: () => void;
  onSelectPayment: (paymentMethodId: string) => void;
  onAmountChange: (value: string) => void;
  onConfirm: () => void;
};

export function PaymentModal({
  open,
  pending,
  total,
  paymentMethods,
  paymentMethodId,
  amountTendered,
  onClose,
  onSelectPayment,
  onAmountChange,
  onConfirm,
}: PaymentModalProps) {
  const selected = paymentMethods.find((method) => method.id === paymentMethodId);
  const isCash = selected?.code === "cash";
  const tendered = Number(amountTendered) || 0;
  const change = Math.max(0, tendered - total);
  const canConfirm =
    Boolean(paymentMethodId) &&
    (!isCash || tendered >= total) &&
    !pending;

  return (
    <Modal
      open={open}
      title="Cobrar"
      onClose={onClose}
      footer={
        <Button
          size="lg"
          className="w-full bg-[var(--color-accent)] hover:opacity-90"
          disabled={!canConfirm}
          onClick={onConfirm}
        >
          {pending
            ? "Registrando…"
            : isCash
              ? `Confirmar · cambio ${formatMoney(change)}`
              : `Confirmar · ${formatMoney(total)}`}
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm">
          Total a cobrar:{" "}
          <span className="text-lg font-semibold">{formatMoney(total)}</span>
        </div>

        <div className="grid gap-2">
          <p className="text-sm font-medium text-[var(--color-muted)]">
            Método de pago
          </p>
          {paymentMethods.map((method) => (
            <Button
              key={method.id}
              size="lg"
              variant={paymentMethodId === method.id ? "primary" : "secondary"}
              className={
                paymentMethodId === method.id
                  ? "bg-[var(--color-accent)] hover:opacity-90"
                  : undefined
              }
              onClick={() => onSelectPayment(method.id)}
            >
              {method.name}
            </Button>
          ))}
        </div>

        {isCash ? (
          <div className="space-y-3 border-t border-[var(--color-border)] pt-4">
            <p className="text-sm font-medium text-[var(--color-muted)]">
              Efectivo recibido
            </p>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={amountTendered}
              onChange={(event) => onAmountChange(event.target.value)}
              placeholder="0"
              className="h-14 text-xl font-semibold"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onAmountChange(String(total))}
              >
                Exacto
              </Button>
              {QUICK_ADD.map((amount) => (
                <Button
                  key={amount}
                  size="sm"
                  variant="secondary"
                  onClick={() => onAmountChange(String(tendered + amount))}
                >
                  +{formatMoney(amount)}
                </Button>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-accent-muted)] px-3 py-3">
              <span className="text-sm font-medium">Devuelta</span>
              <span className="text-2xl font-bold text-[var(--color-accent)]">
                {formatMoney(change)}
              </span>
            </div>
            {tendered > 0 && tendered < total ? (
              <p className="text-sm text-[var(--color-danger)]">
                Falta {formatMoney(total - tendered)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
