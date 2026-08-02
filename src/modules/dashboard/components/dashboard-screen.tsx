import { useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { Category } from "@/domain/entities/category";
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

export function DashboardScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const { categories: categoryService } = await getAppServices();
        const rows = await categoryService.listActive();
        if (!cancelled) {
          setCategories(rows);
        }
      } catch {
        if (!cancelled) {
          setError("No se pudieron cargar las categorías.");
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
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <Badge variant="secondary">Capas activas</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Resumen del turno y catálogo activo.
        </p>
      </div>

      <CashSessionControls />

      <Card>
        <CardHeader>
          <CardTitle>Categorías activas</CardTitle>
          <CardDescription>Listado desde CategoryService.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!loading && !error ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>{category.name}</TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant="success">Activa</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
