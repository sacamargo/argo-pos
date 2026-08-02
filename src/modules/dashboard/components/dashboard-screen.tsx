import { useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { DashboardSnapshot } from "@/domain/entities/dashboard";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";
import { CashSessionControls } from "@/modules/cash/components/cash-session-controls";
import { DashboardMetricCards } from "@/modules/dashboard/components/dashboard-metric-cards";
import { useSessionStore } from "@/shared/hooks/use-session";
import { getErrorMessage } from "@/shared/utils/error-message";
import { formatPesos } from "@/shared/utils/money";

export function DashboardScreen() {
  const user = useSessionStore((state) => state.user);
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const { dashboard } = await getAppServices();
        const data = await dashboard.getSnapshot({ role: user.role });
        if (!cancelled) {
          setSnapshot(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "No se pudo cargar el dashboard"));
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
  }, [user]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          {snapshot ? <Badge variant="outline">{snapshot.date}</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Indicadores del día. Las anuladas no suman a ingresos.
        </p>
      </div>

      <CashSessionControls />

      {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {snapshot ? <DashboardMetricCards snapshot={snapshot} /> : null}

      {snapshot && snapshot.topProducts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Productos vendidos</CardTitle>
            <CardDescription>Top del día (completadas)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Ingresos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.topProducts.map((product) => (
                  <TableRow key={product.productName}>
                    <TableCell>{product.productName}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>{formatPesos(product.revenueCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {user?.role === "admin" && snapshot ? (
        <Card>
          <CardHeader>
            <CardTitle>Stock crítico</CardTitle>
            <CardDescription>Solo visible para admin</CardDescription>
          </CardHeader>
          <CardContent>
            {snapshot.lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas de stock bajo.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.lowStock.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        {item.stockQuantity} {item.unit}
                      </TableCell>
                      <TableCell>
                        {item.minStock} {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
