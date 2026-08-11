import { useCallback, useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { DayCutSummary } from "@/domain/entities/day-cut";
import { isAdminLike } from "@/domain/services/permissions";
import { Button, Input, Modal } from "@/components";
import { DayCutMetrics } from "@/modules/corte/components/day-cut-metrics";
import { DayCutSessionsCard } from "@/modules/corte/components/day-cut-sessions-card";
import { DayCutSoldProducts } from "@/modules/corte/components/day-cut-sold-products";
import { useSessionStore } from "@/shared/hooks/use-session";
import { notify } from "@/shared/hooks/use-toast";
import { todayLocalDateInput } from "@/shared/utils/date";
import { getErrorMessage } from "@/shared/utils/error-message";

export function DayCutScreen() {
  const user = useSessionStore((state) => state.user);
  const canManageCosts = user ? isAdminLike(user.role) : false;
  const [date, setDate] = useState(todayLocalDateInput);
  const [summary, setSummary] = useState<DayCutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [backfillOpen, setBackfillOpen] = useState(false);
  const [backfillBusy, setBackfillBusy] = useState(false);

  const reload = useCallback(async () => {
    const { dayCut } = await getAppServices();
    const next = await dayCut.getDaySummary({ date });
    setSummary(next);
  }, [date]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        await reload();
      } catch (err) {
        if (!cancelled) {
          const message = getErrorMessage(err, "No se pudo cargar el corte");
          setError(message);
          notify({ tone: "error", title: "Corte", description: message });
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

  const runBackfill = async () => {
    setBackfillBusy(true);
    try {
      const { dayCut } = await getAppServices();
      const result = await dayCut.backfillMissingCosts({ date });
      setSummary(result.summary);
      setBackfillOpen(false);
      if (result.updatedLines === 0) {
        notify({
          tone: "warning",
          title: "Sin cambios",
          description:
            "No había líneas para completar (falta costo en el producto o ya estaban llenas).",
        });
      } else {
        notify({
          tone: "success",
          title: "Costos completados",
          description: `${result.updatedLines} línea${result.updatedLines === 1 ? "" : "s"} actualizada${result.updatedLines === 1 ? "" : "s"}.`,
        });
      }
    } catch (err) {
      const message = getErrorMessage(err, "No se pudieron completar los costos");
      notify({ tone: "error", title: "Completar costos", description: message });
    } finally {
      setBackfillBusy(false);
    }
  };

  const saveProductCost = async (productId: string, costPesos: number) => {
    try {
      const { dayCut } = await getAppServices();
      const result = await dayCut.setProductCost({ date, productId, costPesos });
      setSummary(result.summary);
      notify({
        tone: "success",
        title: "Precio de compra guardado",
        description:
          result.updatedLines > 0
            ? `Aplicado a ${result.updatedLines} línea${result.updatedLines === 1 ? "" : "s"} del día.`
            : "Actualizado en el producto.",
      });
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo guardar el precio de compra");
      notify({ tone: "error", title: "Precio de compra", description: message });
      throw err;
    }
  };

  const hasSessions = (summary?.sessions.length ?? 0) > 0;
  const showBackfill =
    canManageCosts && hasSessions && (summary?.profit.missingCostLines ?? 0) > 0;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Corte del día</h1>
          <p className="text-sm text-muted-foreground">
            Resumen por jornada de caja (fecha de apertura). No reemplaza abrir/cerrar caja.
          </p>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-muted-foreground">Día operativo</span>
          <Input
            type="date"
            className="h-11 w-44"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </div>

      {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!loading && summary && !hasSessions ? (
        <p className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm">
          No hay jornada de caja para este día.
        </p>
      ) : null}

      {!loading && summary && hasSessions ? (
        <>
          <DayCutMetrics
            summary={summary}
            showBackfill={showBackfill}
            onBackfill={() => setBackfillOpen(true)}
          />
          <DayCutSessionsCard sessions={summary.sessions} />
          <DayCutSoldProducts
            products={summary.soldProducts}
            canEditCost={canManageCosts}
            busy={backfillBusy}
            onSaveCost={saveProductCost}
          />
        </>
      ) : null}

      <Modal
        open={backfillOpen}
        title="Completar costos"
        description="Rellena el costo en las ventas de este día que no lo tenían, usando el costo actual del producto. No cambia líneas que ya tenían costo."
        onClose={() => {
          if (!backfillBusy) {
            setBackfillOpen(false);
          }
        }}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={backfillBusy}
            onClick={() => setBackfillOpen(false)}
          >
            Cancelar
          </Button>
          <Button disabled={backfillBusy} onClick={() => void runBackfill()}>
            {backfillBusy ? "Completando…" : "Completar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
