"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/design-system/components/badge";
import { Button } from "@/design-system/components/button";
import { Card } from "@/design-system/components/card";
import { Input } from "@/design-system/components/input";
import { reverseSale } from "@/modules/pos/services/sale-query-service";
import type { SaleDetail } from "@/modules/pos/services/sale-query-service";
import { formatMoney } from "@/modules/pos/utils/format";

type SaleDetailViewProps = {
  sale: SaleDetail;
  canReverse: boolean;
};

export function SaleDetailView({ sale, canReverse }: SaleDetailViewProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onReverse() {
    if (!reason.trim()) {
      setError("Indica el motivo de la anulación");
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await reverseSale(sale.id, reason.trim());
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo anular");
      }
    });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Link
            href="/sales"
            className="text-sm text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            ← Ventas
          </Link>
          <h1 className="mt-1 text-2xl font-semibold">{sale.publicId}</h1>
          <p className="text-sm text-[var(--color-muted)]">
            {new Date(sale.createdAt).toLocaleString("es-CO")} · {sale.cashierName}
          </p>
        </div>
        <Badge tone={sale.status === "completed" ? "success" : "warning"}>
          {sale.status === "completed" ? "Completada" : "Anulada"}
        </Badge>
      </div>

      <Card className="space-y-3 p-5">
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-muted)]">Método de pago</span>
          <span className="font-medium">{sale.paymentMethodName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--color-muted)]">Total</span>
          <span className="text-xl font-semibold">{formatMoney(sale.total)}</span>
        </div>
        {sale.amountTendered !== null ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Recibido</span>
              <span>{formatMoney(sale.amountTendered)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-muted)]">Cambio</span>
              <span>{formatMoney(sale.changeAmount ?? 0)}</span>
            </div>
          </>
        ) : null}
        {sale.notes ? (
          <p className="text-sm text-[var(--color-muted)]">Notas: {sale.notes}</p>
        ) : null}
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 text-lg font-semibold">Productos</h2>
        <ul className="space-y-3">
          {sale.items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] pb-3 last:border-0 last:pb-0"
            >
              <div>
                <p className="font-medium">{item.productName}</p>
                <p className="text-sm text-[var(--color-muted)]">
                  {item.optionsSnapshot
                    .map((opt) => `${opt.group}: ${opt.value}`)
                    .join(" · ") || "—"}
                </p>
                <p className="text-sm text-[var(--color-muted)]">
                  {item.quantity} × {formatMoney(item.unitPrice)}
                </p>
              </div>
              <p className="font-semibold">{formatMoney(item.lineTotal)}</p>
            </li>
          ))}
        </ul>
      </Card>

      {canReverse && sale.status === "completed" ? (
        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-semibold">Anular venta</h2>
          <Input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Motivo de la anulación"
          />
          {error ? (
            <p className="text-sm text-[var(--color-danger)]">{error}</p>
          ) : null}
          <Button
            variant="danger"
            disabled={pending}
            onClick={onReverse}
          >
            {pending ? "Anulando…" : "Anular y devolver inventario"}
          </Button>
        </Card>
      ) : null}
    </div>
  );
}
