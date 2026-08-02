import Link from "next/link";
import { listSales } from "@/modules/pos/services/sale-query-service";
import { Card } from "@/design-system/components/card";
import { Badge } from "@/design-system/components/badge";
import { formatMoney } from "@/modules/pos/utils/format";

export default async function SalesPage() {
  const from = new Date();
  from.setDate(from.getDate() - 7);
  from.setHours(0, 0, 0, 0);

  const sales = await listSales({ fromIso: from.toISOString(), limit: 100 });

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Ventas</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Últimos 7 días. Toca una venta para ver el detalle.
        </p>
      </div>

      <Card className="divide-y divide-[var(--color-border)]">
        {sales.length === 0 ? (
          <p className="p-5 text-sm text-[var(--color-muted)]">
            No hay ventas en este período.
          </p>
        ) : (
          sales.map((sale) => (
            <Link
              key={sale.id}
              href={`/sales/${sale.id}`}
              className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-[var(--color-surface-elevated)]"
            >
              <div>
                <p className="font-medium">{sale.publicId}</p>
                <p className="text-sm text-[var(--color-muted)]">
                  {new Date(sale.createdAt).toLocaleString("es-CO")} ·{" "}
                  {sale.paymentMethodName} · {sale.cashierName}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  tone={sale.status === "completed" ? "success" : "warning"}
                >
                  {sale.status === "completed" ? "OK" : "Anulada"}
                </Badge>
                <span className="font-semibold">{formatMoney(sale.total)}</span>
              </div>
            </Link>
          ))
        )}
      </Card>
    </div>
  );
}
