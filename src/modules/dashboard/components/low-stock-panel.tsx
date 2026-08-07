import { AlertTriangle } from "lucide-react";
import type { Ingredient } from "@/domain/entities/ingredient";
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

type LowStockPanelProps = {
  items: Ingredient[];
};

export function LowStockPanel({ items }: LowStockPanelProps) {
  const hasAlerts = items.length > 0;

  return (
    <Card
      className={
        hasAlerts
          ? "border-amber-500/45 bg-amber-500/5 shadow-sm"
          : undefined
      }
    >
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {hasAlerts ? (
                <AlertTriangle
                  className="size-5 text-amber-600 dark:text-amber-400"
                  aria-hidden
                />
              ) : null}
              Stock crítico
            </CardTitle>
            <CardDescription>
              {hasAlerts
                ? "Ítems en o por debajo del mínimo. Revisa inventario."
                : "Sin alertas de stock bajo."}
            </CardDescription>
          </div>
          {hasAlerts ? (
            <Badge
              variant="destructive"
              className="border-amber-600/30 bg-amber-500/15 text-amber-800 dark:text-amber-200"
            >
              {items.length} alerta{items.length === 1 ? "" : "s"}
            </Badge>
          ) : (
            <Badge variant="success">OK</Badge>
          )}
        </div>
      </CardHeader>
      {hasAlerts ? (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ítem</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className="bg-amber-500/[0.03]">
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    {item.stockQuantity} {item.unit}
                  </TableCell>
                  <TableCell>
                    {item.minStock} {item.unit}
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">Stock bajo</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      ) : null}
    </Card>
  );
}
