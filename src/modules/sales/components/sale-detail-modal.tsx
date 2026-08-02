import { useState } from "react";
import type { SaleDetail } from "@/domain/entities/sale";
import { canReverseSale } from "@/domain/services/permissions";
import { Badge, Button, Input, Modal } from "@/components";
import { formatPesos } from "@/shared/utils/money";
import type { PublicUser } from "@/domain/entities/user";

type SaleDetailModalProps = {
  sale: SaleDetail;
  user: PublicUser;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onReverse: (reason: string) => void;
};

export function SaleDetailModal({
  sale,
  user,
  busy,
  error,
  onClose,
  onReverse,
}: SaleDetailModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const canReverse = canReverseSale(user.role) && sale.status === "completed";

  return (
    <Modal
      open
      title={`Venta ${sale.id.slice(0, 8).toUpperCase()}`}
      description={`${new Date(sale.createdAt).toLocaleString("es-CO")} · ${sale.cashierUsername}`}
      onClose={onClose}
      className="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={sale.status === "completed" ? "success" : "destructive"}>
            {sale.status === "completed" ? "Completada" : "Anulada"}
          </Badge>
          <Badge variant="outline">{sale.paymentMethodName}</Badge>
        </div>

        <ul className="space-y-2 rounded-md border border-border p-3 text-sm">
          {sale.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-2">
              <span>
                {item.quantity}× {item.productNameSnapshot}
              </span>
              <span className="font-medium">{formatPesos(item.lineTotalCents)}</span>
            </li>
          ))}
        </ul>

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="text-right">{formatPesos(sale.subtotalCents)}</dd>
          <dt className="text-muted-foreground">Total</dt>
          <dd className="text-right font-semibold">{formatPesos(sale.totalCents)}</dd>
          {sale.amountTenderedCents !== null ? (
            <>
              <dt className="text-muted-foreground">Recibido</dt>
              <dd className="text-right">{formatPesos(sale.amountTenderedCents)}</dd>
            </>
          ) : null}
          {sale.changeCents !== null ? (
            <>
              <dt className="text-muted-foreground">Cambio</dt>
              <dd className="text-right">{formatPesos(sale.changeCents)}</dd>
            </>
          ) : null}
        </dl>

        {sale.reversal ? (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Anulada: {sale.reversal.reason}
          </p>
        ) : null}

        {confirming ? (
          <div className="space-y-3 rounded-md border border-destructive/40 p-3">
            <p className="text-sm font-medium">Confirmar anulación</p>
            <Input
              placeholder="Motivo obligatorio"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={busy}
              maxLength={200}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setConfirming(false);
                  setReason("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={busy || reason.trim().length < 3}
                onClick={() => onReverse(reason.trim())}
              >
                {busy ? "Anulando…" : "Anular venta"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            {canReverse ? (
              <Button variant="destructive" onClick={() => setConfirming(true)}>
                Anular
              </Button>
            ) : null}
          </div>
        )}
      </div>
    </Modal>
  );
}
