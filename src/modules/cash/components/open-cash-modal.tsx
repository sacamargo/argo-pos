import { useState } from "react";
import { Button, Input, Modal } from "@/components";
import { pesosToCents } from "@/shared/utils/money";

type OpenCashModalProps = {
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (openingAmountCents: number, note?: string) => void;
};

export function OpenCashModal({
  open,
  busy,
  error,
  onClose,
  onSubmit,
}: OpenCashModalProps) {
  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");

  const handleSubmit = () => {
    const pesos = Number(amount);
    if (Number.isNaN(pesos) || pesos < 0) {
      return;
    }
    onSubmit(pesosToCents(pesos), note.trim() || undefined);
  };

  return (
    <Modal
      open={open}
      title="Abrir caja"
      description="Indica el efectivo inicial del turno."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Monto inicial (COP)</span>
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
          <Button onClick={handleSubmit} disabled={busy}>
            {busy ? "Abriendo…" : "Abrir caja"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
