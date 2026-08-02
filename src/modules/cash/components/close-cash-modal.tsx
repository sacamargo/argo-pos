import { useState } from "react";
import type { CashSessionSummary } from "@/domain/entities/cash-session";
import { Button, Input, Modal } from "@/components";
import { formatPesos, pesosToCents } from "@/shared/utils/money";

type CloseCashModalProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  summary: CashSessionSummary | null;
  onClose: () => void;
  onSubmit: (closingAmountCents: number, note?: string) => void;
};

export function CloseCashModal({
  open,
  busy,
  error,
  summary,
  onClose,
  onSubmit,
}: CloseCashModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const counted = Number(amount);
  const previewDifference =
    summary && !Number.isNaN(counted) && amount !== ""
      ? pesosToCents(counted) - summary.expectedCashCents
      : null;

  const handleSubmit = () => {
    if (Number.isNaN(counted) || counted < 0) {
      return;
    }
    onSubmit(pesosToCents(counted), note.trim() || undefined);
  };

  return (
    <Modal
      open={open}
      title="Cerrar caja"
      description="Cuenta el efectivo y confirma el cierre del turno."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        {summary ? (
          <dl className="grid grid-cols-2 gap-2 rounded-md border border-border p-3 text-sm">
            <dt className="text-muted-foreground">Apertura</dt>
            <dd className="text-right font-medium">
              {formatPesos(summary.session.openingAmountCents)}
            </dd>
            <dt className="text-muted-foreground">Ventas</dt>
            <dd className="text-right font-medium">
              {summary.totals.salesCount} · {formatPesos(summary.totals.salesTotalCents)}
            </dd>
            <dt className="text-muted-foreground">Efectivo esperado</dt>
            <dd className="text-right font-medium">
              {formatPesos(summary.expectedCashCents)}
            </dd>
          </dl>
        ) : null}

        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Monto contado (COP)</span>
          <Input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            disabled={busy}
          />
        </label>

        {previewDifference !== null ? (
          <p className="text-sm text-muted-foreground">
            Diferencia:{" "}
            <span className="font-medium text-foreground">
              {formatPesos(previewDifference)}
            </span>
          </p>
        ) : null}

        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Nota (opcional)</span>
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={busy}
            maxLength={200}
          />
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={busy || amount === ""}>
            {busy ? "Cerrando…" : "Cerrar caja"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
