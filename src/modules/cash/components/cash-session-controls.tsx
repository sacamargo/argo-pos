import { useCallback, useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { CashSessionSummary } from "@/domain/entities/cash-session";
import { Badge, Button } from "@/components";
import { CloseCashModal } from "@/modules/cash/components/close-cash-modal";
import { OpenCashModal } from "@/modules/cash/components/open-cash-modal";
import { useSessionStore } from "@/shared/hooks/use-session";
import { formatPesos } from "@/shared/utils/money";

type CashSessionControlsProps = {
  compact?: boolean;
};

export function CashSessionControls({ compact = false }: CashSessionControlsProps) {
  const user = useSessionStore((state) => state.user);
  const [summary, setSummary] = useState<CashSessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);

  const reload = useCallback(async () => {
    const { cashSessions } = await getAppServices();
    const next = await cashSessions.getOpenSummary();
    setSummary(next);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reload();
      } catch {
        if (!cancelled) {
          setError("No se pudo cargar el estado de caja.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const handleOpen = async (openingAmountCents: number, note?: string) => {
    if (!user) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { cashSessions } = await getAppServices();
      await cashSessions.openSession({
        openedByUserId: user.id,
        openingAmountCents,
        note,
      });
      setOpenModal(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir la caja");
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
      const { cashSessions } = await getAppServices();
      await cashSessions.closeSession({
        closedByUserId: user.id,
        closingAmountCents,
        note,
      });
      setCloseModal(false);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar la caja");
    } finally {
      setBusy(false);
    }
  };

  const isOpen = summary?.session.status === "open";

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-2">
          <Badge variant={isOpen ? "success" : "secondary"}>
            {loading ? "Caja…" : isOpen ? "Caja abierta" : "Caja cerrada"}
          </Badge>
          {!loading && !isOpen ? (
            <Button size="sm" variant="outline" onClick={() => setOpenModal(true)}>
              Abrir
            </Button>
          ) : null}
          {!loading && isOpen ? (
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
              {loading ? "…" : isOpen ? "Abierta" : "Cerrada"}
            </Badge>
          </div>
          {isOpen && summary ? (
            <p className="text-sm text-muted-foreground">
              Apertura {formatPesos(summary.session.openingAmountCents)} · Esperado{" "}
              {formatPesos(summary.expectedCashCents)} · {summary.totals.salesCount} ventas
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Abre la caja para poder cobrar en el POS.
            </p>
          )}
          {error && !openModal && !closeModal ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          {!isOpen ? (
            <Button onClick={() => setOpenModal(true)} disabled={loading}>
              Abrir caja
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setCloseModal(true)} disabled={loading}>
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
