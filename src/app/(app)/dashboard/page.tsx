import Link from "next/link";
import { getDashboardSummary } from "@/modules/analytics/services/analytics-service";
import { Card } from "@/design-system/components/card";
import { Badge } from "@/design-system/components/badge";
import { formatMoney } from "@/modules/pos/utils/format";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Resumen del negocio en tiempo real.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-[var(--color-muted)]">Ventas del día</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatMoney(summary.salesToday)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--color-muted)]">Ventas del mes</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatMoney(summary.salesMonth)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-[var(--color-muted)]">Más vendido hoy</p>
          <p className="mt-2 text-xl font-semibold">
            {summary.topProductToday ?? "Sin ventas"}
          </p>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Últimas ventas</h2>
            <Link
              href="/sales"
              className="text-sm text-[var(--color-accent)] hover:underline"
            >
              Ver todas
            </Link>
          </div>
          <ul className="space-y-2">
            {summary.recentSales.length === 0 ? (
              <li className="text-sm text-[var(--color-muted)]">
                Aún no hay ventas.
              </li>
            ) : (
              summary.recentSales.map((sale) => (
                <li key={sale.id}>
                  <Link
                    href={`/sales/${sale.id}`}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface-elevated)] px-3 py-2 text-sm hover:opacity-90"
                  >
                    <div>
                      <p className="font-medium">{sale.publicId}</p>
                      <p className="text-[var(--color-muted)]">
                        {new Date(sale.createdAt).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {sale.paymentMethodName}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sale.status !== "completed" ? (
                        <Badge tone="warning">Anulada</Badge>
                      ) : null}
                      <span className="font-semibold">
                        {formatMoney(sale.total)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Card>

        {summary.showInventory ? (
          <Card className="p-5">
            <h2 className="mb-4 text-lg font-semibold">Inventario crítico</h2>
            <ul className="space-y-3">
              {summary.criticalIngredients.length === 0 ? (
                <li className="text-sm text-[var(--color-muted)]">
                  Todo el inventario está bien.
                </li>
              ) : (
                summary.criticalIngredients.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>{item.name}</span>
                    <Badge tone="warning">
                      {item.stockQty} / mín {item.minStock}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
