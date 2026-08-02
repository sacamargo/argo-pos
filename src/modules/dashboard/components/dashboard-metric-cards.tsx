import type { DashboardSnapshot } from "@/domain/entities/dashboard";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";
import { formatPesos } from "@/shared/utils/money";

type MetricCardsProps = {
  snapshot: DashboardSnapshot;
};

export function DashboardMetricCards({ snapshot }: MetricCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Ventas del día</CardDescription>
          <CardTitle className="text-2xl">{snapshot.salesCount}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {snapshot.unitsSold} unidades
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Ingresos</CardDescription>
          <CardTitle className="text-2xl">{formatPesos(snapshot.revenueCents)}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Solo ventas completadas
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Caja</CardDescription>
          <CardTitle className="text-2xl">
            <Badge variant={snapshot.cashOpen ? "success" : "secondary"}>
              {snapshot.cashOpen ? "Abierta" : "Cerrada"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {snapshot.cashOpen && snapshot.cashOpeningCents !== null
            ? `Apertura ${formatPesos(snapshot.cashOpeningCents)}`
            : "Sin sesión abierta"}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardDescription>Última venta</CardDescription>
          <CardTitle className="text-lg">
            {snapshot.lastSale
              ? formatPesos(snapshot.lastSale.totalCents)
              : "—"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {snapshot.lastSale
            ? `${new Date(snapshot.lastSale.createdAt).toLocaleTimeString("es-CO", {
                hour: "2-digit",
                minute: "2-digit",
              })} · ${snapshot.lastSale.paymentMethodName}`
            : "Sin ventas hoy"}
        </CardContent>
      </Card>
    </div>
  );
}
