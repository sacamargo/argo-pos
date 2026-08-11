import { useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import { Badge, Button } from "@/components";
import { CloseCashModal } from "@/modules/cash/components/close-cash-modal";
import { OpenCashModal } from "@/modules/cash/components/open-cash-modal";
import { useCashSessionStore } from "@/shared/hooks/use-cash-session";
import { useSessionStore } from "@/shared/hooks/use-session";
import { notify } from "@/shared/hooks/use-toast";
import { formatCashDateTime } from "@/shared/utils/format-datetime";
import { formatPesos } from "@/shared/utils/money";

type CashSessionControlsProps = {
  compact?: boolean;
};

export function CashSessionControls({ compact = false }: CashSessionControlsProps) {
  const user = useSessionStore((state) => state.user);
  const summary = useCashSessionStore((state) => state.summary);
  const loading = useCashSessionStore((state) => state.loading);
  const hydrated = useCashSessionStore((state) => state.hydrated);
  const storeError = useCashSessionStore((state) => state.error);
  const refresh = useCashSessionStore((state) => state.refresh);
  const openSession = useCashSessionStore((state) => state.openSession);
  const closeSession = useCashSessionStore((state) => state.closeSession);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      void refresh().catch(() => {
        // El store ya guarda el mensaje de error.
      });
    }
  }, [hydrated, refresh]);

  const handleOpen = async (openingAmountCents: number, note?: string) => {
    if (!user) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await openSession({
        openedByUserId: user.id,
        openingAmountCents,
        note,
      });
      setOpenModal(false);
      notify({ tone: "success", title: "Caja abierta" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo abrir la caja";
      setError(message);
      notify({ tone: "error", title: "Abrir caja", description: message });
    } finally {
      setBusy(false);
    }
  };

  const handleClose = async (closingAmountCents: number, note?: string) => {
    if (!user) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await closeSession({
        closedByUserId: user.id,
        closingAmountCents,
        note,
      });
      try {
        const { backups } = await getAppServices();
        await backups.createBackup({ note: "Auto al cerrar caja" });
      } catch {
        // El cierre ya quedó; no bloquear por fallo de backup.
      }
      setCloseModal(false);
      notify({ tone: "success", title: "Caja cerrada" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cerrar la caja";
      setError(message);
      notify({ tone: "error", title: "Cerrar caja", description: message });
    } finally {
      setBusy(false);
    }
  };

  const isOpen = summary?.session.status === "open";
  const showLoading = loading && !hydrated;
  const displayError = error ?? (!openModal && !closeModal ? storeError : null);

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Badge variant={isOpen ? "success" : "secondary"}>
            {showLoading ? "Caja…" : isOpen ? "Caja abierta" : "Caja cerrada"}
          </Badge>
          {!showLoading && !isOpen ? (
            <Button size="sm" variant="outline" onClick={() => setOpenModal(true)}>
              Abrir
            </Button>
          ) : null}
          {!showLoading && isOpen ? (
            <Button size="sm" variant="outline" onClick={() => setCloseModal(true)}>
              Cerrar
            </Button>
          ) : null}
        </div>
        <OpenCashModal
          open={openModal}
          busy={busy}
          error={error}
          onClose={() => {
            setOpenModal(false);
            setError(null);
          }}
          onSubmit={(amount, note) => void handleOpen(amount, note)}
        />
        <CloseCashModal
          open={closeModal}
          busy={busy}
          error={error}
          summary={summary}
          onClose={() => {
            setCloseModal(false);
            setError(null);
          }}
          onSubmit={(amount, note) => void handleClose(amount, note)}
        />
      </>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">Caja</h2>
            <Badge variant={isOpen ? "success" : "secondary"}>
              {showLoading ? "…" : isOpen ? "Abierta" : "Cerrada"}
            </Badge>
          </div>
          {isOpen && summary ? (
            <div className="space-y-0.5 text-sm text-muted-foreground">
              <p>
                Apertura {formatPesos(summary.session.openingAmountCents)} · Esperado{" "}
                {formatPesos(summary.expectedCashCents)} · {summary.totals.salesCount} ventas
              </p>
              <p>Apertura: {formatCashDateTime(summary.session.openedAt)}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Abre la caja para poder cobrar en el POS.
            </p>
          )}
          {displayError ? (
            <p className="text-sm text-destructive">{displayError}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {!isOpen ? (
            <Button onClick={() => setOpenModal(true)} disabled={showLoading}>
              Abrir caja
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => setCloseModal(true)}
              disabled={showLoading}
            >
              Cerrar caja
            </Button>
          )}
        </div>
      </div>

      <OpenCashModal
        open={openModal}
        busy={busy}
        error={error}
        onClose={() => {
          setOpenModal(false);
          setError(null);
        }}
        onSubmit={(amount, note) => void handleOpen(amount, note)}
      />
      <CloseCashModal
        open={closeModal}
        busy={busy}
        error={error}
        summary={summary}
        onClose={() => {
          setCloseModal(false);
          setError(null);
        }}
        onSubmit={(amount, note) => void handleClose(amount, note)}
      />
    </div>
  );
}
