import { useState, type ReactNode } from "react";
import { Button, Input, Modal } from "@/components";

type ConfirmDestructiveModalProps = {
  open: boolean;
  title: string;
  description: string;
  /** Exact phrase the user must type (e.g. ELIMINAR, VACIAR). */
  confirmPhrase: string;
  confirmLabel?: string;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
  children?: ReactNode;
};

export function ConfirmDestructiveModal({
  open,
  title,
  description,
  confirmPhrase,
  confirmLabel = "Confirmar",
  busy = false,
  error = null,
  onClose,
  onConfirm,
  children,
}: ConfirmDestructiveModalProps) {
  const [phrase, setPhrase] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const reset = () => {
    setPhrase("");
    setStep(1);
  };

  const close = () => {
    if (busy) {
      return;
    }
    reset();
    onClose();
  };

  if (!open) {
    return null;
  }

  return (
    <Modal open={open} title={title} description={description} onClose={close}>
      <div className="flex flex-col gap-4">
        {children}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {step === 1 ? (
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={close}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                setPhrase("");
                setStep(2);
              }}
            >
              Sí, continuar
            </Button>
          </div>
        ) : (
          <>
            <label className="space-y-1 text-sm">
              <span className="font-medium">
                Escribe {confirmPhrase} para confirmar
              </span>
              <Input
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
                disabled={busy}
                autoComplete="off"
                autoFocus
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setStep(1);
                  setPhrase("");
                }}
              >
                Atrás
              </Button>
              <Button
                variant="destructive"
                disabled={busy || phrase !== confirmPhrase}
                onClick={onConfirm}
              >
                {busy ? "Procesando…" : confirmLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
