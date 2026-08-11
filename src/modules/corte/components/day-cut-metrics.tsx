import type { DayCutSummary } from "@/domain/entities/day-cut";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";
import { formatPesos } from "@/shared/utils/money";

type DayCutMetricsProps = {
  summary: DayCutSummary;
  showBackfill: boolean;
  onBackfill: () => void;
};

export function DayCutMetrics({ summary, showBackfill, onBackfill }: DayCutMetricsProps) {
  const cashPayment = summary.payments.find((payment) => payment.code === "cash");
  const transferPayment = summary.payments.find((payment) => payment.code === "transfer");
  const otherPayments = summary.payments.filter(
    (payment) => payment.code !== "cash" && payment.code !== "transfer",
  );

  return (
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
            <CardTitle className="text-2xl">{formatPesos(summary.revenueCents)}</CardTitle>
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
              <Button size="sm" variant="outline" className="w-full" onClick={onBackfill}>
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

      {otherPayments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Otros métodos de pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {otherPayments.map((payment) => (
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
    </>
  );
}
