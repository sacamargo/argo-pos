import { useCallback, useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { DayCutSummary } from "@/domain/entities/day-cut";
import { isAdminLike } from "@/domain/services/permissions";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";
import { useSessionStore } from "@/shared/hooks/use-session";
import { notify } from "@/shared/hooks/use-toast";
import { todayLocalDateInput } from "@/shared/utils/date";
import { getErrorMessage } from "@/shared/utils/error-message";
import { formatPesos } from "@/shared/utils/money";

function formatDateTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function DayCutScreen() {
  const user = useSessionStore((state) => state.user);
  const canBackfill = user ? isAdminLike(user.role) : false;
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

  const hasSessions = (summary?.sessions.length ?? 0) > 0;
  const cashPayment = summary?.payments.find((p) => p.code === "cash");
  const transferPayment = summary?.payments.find((p) => p.code === "transfer");
  const showBackfill =
    canBackfill && hasSessions && (summary?.profit.missingCostLines ?? 0) > 0;

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ventas</CardDescription>
                <CardTitle className="text-2xl">{summary.salesCount}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {summary.unitsSold} unidades
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ventas totales</CardDescription>
                <CardTitle className="text-2xl">
                  {formatPesos(summary.revenueCents)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Completadas del turno
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ganancia del día</CardDescription>
                <CardTitle className="text-2xl">
                  {formatPesos(summary.profit.profitCents)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {summary.profit.missingCostLines === 0 && summary.salesCount > 0 ? (
                  <Badge variant="success">Ganancia completa</Badge>
                ) : (
                  <span>
                    Ganancia parcial
                    {summary.profit.missingCostLines > 0
                      ? ` · ${summary.profit.missingCostLines} líneas sin costo`
                      : ""}
                  </span>
                )}
                {showBackfill ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => setBackfillOpen(true)}
                  >
                    Completar costos
                  </Button>
                ) : null}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Base de caja</CardDescription>
                <CardTitle className="text-2xl">
                  {formatPesos(summary.openingAmountCents)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {summary.sessions.length} sesión
                {summary.sessions.length === 1 ? "" : "es"}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Efectivo</CardDescription>
                <CardTitle className="text-xl">
                  {formatPesos(cashPayment?.totalCents ?? 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {cashPayment?.salesCount ?? 0} ventas
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Transferencia</CardDescription>
                <CardTitle className="text-xl">
                  {formatPesos(transferPayment?.totalCents ?? 0)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {transferPayment?.salesCount ?? 0} ventas
              </CardContent>
            </Card>
          </div>

          {summary.payments.some(
            (payment) => payment.code !== "cash" && payment.code !== "transfer",
          ) ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Otros métodos de pago</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {summary.payments
                  .filter((payment) => payment.code !== "cash" && payment.code !== "transfer")
                  .map((payment) => (
                    <div key={payment.code} className="flex justify-between gap-2">
                      <span>
                        {payment.name} ({payment.salesCount})
                      </span>
                      <span>{formatPesos(payment.totalCents)}</span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sesiones de caja</CardTitle>
              <CardDescription>
                El día operativo es la fecha local de apertura.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estado</TableHead>
                    <TableHead>Apertura</TableHead>
                    <TableHead>Cierre</TableHead>
                    <TableHead>Base</TableHead>
                    <TableHead>Abrió</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.sessions.map((row) => (
                    <TableRow key={row.session.id}>
                      <TableCell>
                        <Badge
                          variant={
                            row.session.status === "open" ? "success" : "secondary"
                          }
                        >
                          {row.session.status === "open" ? "Abierta" : "Cerrada"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDateTime(row.session.openedAt)}</TableCell>
                      <TableCell>{formatDateTime(row.session.closedAt)}</TableCell>
                      <TableCell>
                        {formatPesos(row.session.openingAmountCents)}
                      </TableCell>
                      <TableCell>{row.openedByUsername ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 6 productos</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {summary.topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin ventas en la jornada.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Ingresos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summary.topProducts.map((product) => (
                      <TableRow key={product.productName}>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{formatPesos(product.revenueCents)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Modal
        open={backfillOpen}
        title="Completar costos faltantes"
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
