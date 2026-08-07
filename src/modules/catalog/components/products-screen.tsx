import { useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { Category } from "@/domain/entities/category";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { Product } from "@/domain/entities/product";
import {
  Badge,
  Button,
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
import { ProductFormCard } from "@/modules/catalog/components/product-form-card";
import {
  emptyProductForm,
  type ProductFormState,
} from "@/modules/catalog/components/product-form-state";
import { centsToPesos, formatPesos, pesosToCents } from "@/shared/utils/money";

type ProductsScreenProps = {
  categories: Category[];
};

export function ProductsScreen({ categories }: ProductsScreenProps) {
  const activeCategories = categories.filter((category) => category.active);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    const { products: productService } = await getAppServices();
    const [productRows, ingredientRows] = await Promise.all([
      productService.listAll(),
      productService.listActiveIngredients(),
    ]);
    setProducts(productRows);
    setIngredients(ingredientRows);
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reload();
        if (!cancelled) {
          const firstActiveId = categories.find((category) => category.active)?.id ?? "";
          setForm(emptyProductForm(firstActiveId));
        }
      } catch {
        if (!cancelled) {
          setError("No se pudieron cargar los productos.");
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
  }, [categories]);

  const startCreate = () => {
    setError(null);
    setForm(emptyProductForm(activeCategories[0]?.id ?? ""));
  };

  const startEdit = async (productId: string) => {
    setError(null);
    setBusyId(productId);
    try {
      const { products: productService } = await getAppServices();
      const detail = await productService.getById(productId);
      if (!detail) {
        setError("Producto no encontrado");
        return;
      }
      setForm({
        id: detail.id,
        code: detail.code,
        name: detail.name,
        categoryId: detail.categoryId ?? activeCategories[0]?.id ?? "",
        imagePath: detail.imagePath ?? "",
        pricePesos: String(centsToPesos(detail.priceCents)),
        fulfillmentType: detail.fulfillmentType,
        stockItemId: detail.stockItemId ?? "",
        qtyPerSale: String(detail.qtyPerSale ?? 1),
        recipe: detail.recipe.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: String(item.quantity),
        })),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el producto");
    } finally {
      setBusyId(null);
    }
  };

  const onPickImage = async (file: File) => {
    setUploadingImage(true);
    setError(null);
    try {
      const { productImages } = await getAppServices();
      const saved = await productImages.saveFromFile(file);
      setForm((current) => ({ ...current, imagePath: saved.fileName }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la imagen");
    } finally {
      setUploadingImage(false);
    }
  };

  const onClearImage = () => {
    setForm((current) => ({ ...current, imagePath: "" }));
  };

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const price = Number(form.pricePesos);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("El precio debe ser mayor a 0");
      }

      const base = {
        code: form.code,
        name: form.name,
        categoryId: form.categoryId,
        imagePath: form.imagePath.trim() ? form.imagePath.trim() : null,
        priceCents: pesosToCents(price),
      };

      const payload =
        form.fulfillmentType === "simple"
          ? {
              ...base,
              fulfillmentType: "simple" as const,
              stockItemId: form.stockItemId,
              qtyPerSale: Number(form.qtyPerSale),
              recipe: [],
            }
          : {
              ...base,
              fulfillmentType: "compound" as const,
              recipe: form.recipe.map((item) => ({
                ingredientId: item.ingredientId,
                quantity: Number(item.quantity),
              })),
            };

      const { products: productService } = await getAppServices();
      if (form.id) {
        await productService.update({ id: form.id, ...payload });
      } else {
        await productService.create(payload);
      }
      await reload();
      startCreate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el producto");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product: Product) => {
    setBusyId(product.id);
    setError(null);
    try {
      const { products: productService } = await getAppServices();
      await productService.setActive({ id: product.id, active: !product.active });
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    } finally {
      setBusyId(null);
    }
  };

  const categoryName = (categoryId: string | null) =>
    categories.find((category) => category.id === categoryId)?.name ?? "—";

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <ProductFormCard
        form={form}
        categories={categories}
        ingredients={ingredients}
        error={error}
        saving={saving}
        uploadingImage={uploadingImage}
        onChange={setForm}
        onPickImage={(file) => void onPickImage(file)}
        onClearImage={onClearImage}
        onSave={() => void onSave()}
        onReset={startCreate}
      />

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>{products.length} producto(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
          {!loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.code} · {product.fulfillmentType} ·{" "}
                        {categoryName(product.categoryId)}
                        {product.imagePath ? " · Con imagen" : ""}
                      </div>
                    </TableCell>
                    <TableCell>{formatPesos(product.priceCents)}</TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "success" : "secondary"}>
                        {product.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        disabled={busyId === product.id}
                        onClick={() => void startEdit(product.id)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={busyId === product.id}
                        onClick={() => void toggleActive(product)}
                      >
                        {product.active ? "Desactivar" : "Activar"}
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
