import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { getAppServices } from "@/application/container";
import { createCategoryInputSchema } from "@/application/services/category-service";
import type { Category } from "@/domain/entities/category";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";

type CreateFormValues = z.infer<typeof createCategoryInputSchema>;

export function CategoriesScreen() {
  const [rows, setRows] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createCategoryInputSchema),
    defaultValues: { code: "", name: "" },
  });

  const reload = useCallback(async () => {
    const { categories } = await getAppServices();
    const data = await categories.listAll();
    setRows(data);
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        await reload();
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
  }, [reload]);

  const onCreate = handleSubmit(async (values) => {
    setError(null);
    try {
      const { categories } = await getAppServices();
      await categories.create({
        code: values.code,
        name: values.name,
        sortOrder: rows.length + 1,
      });
      reset({ code: "", name: "" });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la categoría");
    }
  });

  const toggleActive = async (category: Category) => {
    setBusyId(category.id);
    setError(null);
    try {
      const { categories } = await getAppServices();
      await categories.setActive({ id: category.id, active: !category.active });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Categorías</h1>
        <p className="text-sm text-muted-foreground">
          Un solo nivel. Desactivar oculta la categoría sin borrarla.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alta rápida</CardTitle>
          <CardDescription>Nombre visible en POS y catálogo.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onCreate}>
            <div className="flex-1 space-y-1">
              <Input
                placeholder="Código (CAT-GRAN)"
                className="h-12"
                aria-label="Código de categoría"
                {...register("code")}
              />
              {errors.code ? (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              ) : null}
            </div>
            <div className="flex-[1.4] space-y-1">
              <Input
                placeholder="Ej. Granizados"
                className="h-12"
                aria-label="Nombre de categoría"
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              ) : null}
            </div>
            <Button type="submit" size="lg" className="h-12" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : "Agregar"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>{rows.length} categoría(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
          {error ? <p className="mb-3 text-sm text-destructive">{error}</p> : null}
          {!loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-mono text-xs">{category.code}</TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.sortOrder}</TableCell>
                    <TableCell>
                      <Badge variant={category.active ? "success" : "secondary"}>
                        {category.active ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        disabled={busyId === category.id}
                        onClick={() => void toggleActive(category)}
                      >
                        {category.active ? "Desactivar" : "Activar"}
                      </Button>
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
