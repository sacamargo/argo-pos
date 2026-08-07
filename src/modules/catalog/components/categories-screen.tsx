import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";
import { ListSearchInput } from "@/modules/shared/components/list-search-input";
import { notify } from "@/shared/hooks/use-toast";
import { matchesNameSearch } from "@/shared/utils/name-search";

type CreateFormValues = z.infer<typeof createCategoryInputSchema>;

export function CategoriesScreen() {
  const [rows, setRows] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createCategoryInputSchema),
    defaultValues: { name: "" },
  });

  const filtered = useMemo(
    () => rows.filter((category) => matchesNameSearch(category.name, query)),
    [rows, query],
  );

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

  const closeForm = () => {
    setFormOpen(false);
    reset({ name: "" });
  };

  const onCreate = handleSubmit(async (values) => {
    setError(null);
    try {
      const { categories } = await getAppServices();
      await categories.create({
        name: values.name,
        sortOrder: rows.length + 1,
      });
      closeForm();
      await reload();
      notify({ tone: "success", title: "Categoría creada", description: values.name });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo crear la categoría";
      setError(message);
      notify({ tone: "error", title: "Categoría", description: message });
    }
  });

  const toggleActive = async (category: Category) => {
    setBusyId(category.id);
    setError(null);
    try {
      const { categories } = await getAppServices();
      await categories.setActive({ id: category.id, active: !category.active });
      await reload();
      notify({
        tone: "success",
        title: category.active ? "Categoría desactivada" : "Categoría activada",
        description: category.name,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar el estado";
      setError(message);
      notify({ tone: "error", title: "Categoría", description: message });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Categorías</h2>
          <p className="text-sm text-muted-foreground">
            Un solo nivel. Desactivar oculta la categoría sin borrarla.
          </p>
        </div>
        <Button
          className="h-11"
          onClick={() => {
            setError(null);
            reset({ name: "" });
            setFormOpen(true);
          }}
        >
          Agregar categoría
        </Button>
      </div>

      {error && !formOpen ? <p className="text-sm text-destructive">{error}</p> : null}

      <ListSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar categoría por nombre…"
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>
            {query.trim()
              ? `${filtered.length} de ${rows.length} categoría(s)`
              : `${rows.length} categoría(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
          {!loading && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay categorías. Pulsa “Agregar categoría”.
            </p>
          ) : null}
          {!loading && rows.length > 0 && filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ninguna categoría coincide con “{query.trim()}”.
            </p>
          ) : null}
          {!loading && filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((category) => (
                  <TableRow key={category.id}>
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

      <Modal
        open={formOpen}
        title="Agregar categoría"
        description="Nombre visible en POS y catálogo."
        onClose={closeForm}
      >
        <form className="flex flex-col gap-3" onSubmit={onCreate}>
          <div className="space-y-1">
            <Input
              placeholder="Ej. Granizados"
              className="h-12"
              aria-label="Nombre de categoría"
              {...register("name")}
            />
            {errors.name ? (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            ) : null}
            {error && formOpen ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="h-12" disabled={isSubmitting}>
              {isSubmitting ? "Guardando…" : "Crear categoría"}
            </Button>
            <Button type="button" variant="outline" className="h-12" onClick={closeForm}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
