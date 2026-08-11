import { useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { Category } from "@/domain/entities/category";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { Product } from "@/domain/entities/product";
import {
  emptyProductForm,
  type ProductFormState,
} from "@/modules/catalog/components/product-form-state";
import { notify } from "@/shared/hooks/use-toast";
import { centsToPesos, pesosToCents } from "@/shared/utils/money";

export function useProductsScreen(categories: Category[]) {
  const activeCategories = categories.filter((category) => category.active);
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm());
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
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
      } catch {
        if (!cancelled) {
          setListError("No se pudieron cargar los productos.");
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

  const closeForm = () => {
    setFormOpen(false);
    setError(null);
    setForm(emptyProductForm(activeCategories[0]?.id ?? ""));
  };

  const startCreate = () => {
    setError(null);
    setListError(null);
    setForm(emptyProductForm(activeCategories[0]?.id ?? ""));
    setFormOpen(true);
  };

  const startEdit = async (productId: string) => {
    setError(null);
    setListError(null);
    setBusyId(productId);
    try {
      const { products: productService } = await getAppServices();
      const detail = await productService.getById(productId);
      if (!detail) {
        setListError("Producto no encontrado");
        return;
      }
      setForm({
        id: detail.id,
        name: detail.name,
        categoryId: detail.categoryId ?? activeCategories[0]?.id ?? "",
        imagePath: detail.imagePath ?? "",
        pricePesos: String(centsToPesos(detail.priceCents)),
        costPesos:
          detail.costCents === null ? "" : String(centsToPesos(detail.costCents)),
        fulfillmentType: detail.fulfillmentType,
        inventoryLinkMode: "existing",
        stockItemId: detail.stockItemId ?? "",
        qtyPerSale: String(detail.qtyPerSale ?? 1),
        newInventoryUnit: "und",
        newInventoryMin: "0",
        newInventoryInitial: "0",
        recipe: detail.recipe.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: String(item.quantity),
        })),
      });
      setFormOpen(true);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "No se pudo abrir el producto");
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

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const price = Number(form.pricePesos);
      if (!Number.isFinite(price) || price <= 0) {
        throw new Error("El precio debe ser mayor a 0");
      }

      const costRaw = form.costPesos.trim();
      let costCents: number | null = null;
      if (costRaw !== "") {
        const cost = Number(costRaw);
        if (!Number.isFinite(cost) || cost < 0) {
          throw new Error("El costo debe estar vacío o ser mayor o igual a 0");
        }
        costCents = pesosToCents(cost);
      }

      const base = {
        name: form.name,
        categoryId: form.categoryId,
        imagePath: form.imagePath.trim() ? form.imagePath.trim() : null,
        priceCents: pesosToCents(price),
        costCents,
      };

      if (form.fulfillmentType === "compound") {
        if (ingredients.length === 0) {
          throw new Error(
            "Para un producto Compuesto primero crea los insumos en Inventario (vaso, base, etc.).",
          );
        }
        if (form.recipe.length === 0) {
          throw new Error("Agrega al menos un ítem a la receta (ej. vaso + base).");
        }
      }

      const payload =
        form.fulfillmentType === "simple"
          ? form.id || form.inventoryLinkMode === "existing"
            ? {
                ...base,
                fulfillmentType: "simple" as const,
                stockItemId: form.stockItemId,
                qtyPerSale: Number(form.qtyPerSale),
                recipe: [],
              }
            : {
                ...base,
                fulfillmentType: "simple" as const,
                qtyPerSale: Number(form.qtyPerSale),
                recipe: [],
                createInventory: {
                  unit: form.newInventoryUnit,
                  minStock: Number(form.newInventoryMin) || 0,
                  initialStock: Number(form.newInventoryInitial) || 0,
                },
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
        notify({ tone: "success", title: "Producto actualizado", description: form.name });
      } else {
        await productService.create(payload);
        notify({ tone: "success", title: "Producto creado", description: form.name });
      }
      await reload();
      closeForm();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo guardar el producto";
      setError(message);
      notify({ tone: "error", title: "Producto", description: message });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product: Product) => {
    setBusyId(product.id);
    setListError(null);
    try {
      const { products: productService } = await getAppServices();
      await productService.setActive({ id: product.id, active: !product.active });
      await reload();
      notify({
        tone: "success",
        title: product.active ? "Producto desactivado" : "Producto activado",
        description: product.name,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo cambiar el estado";
      setListError(message);
      notify({ tone: "error", title: "Producto", description: message });
    } finally {
      setBusyId(null);
    }
  };

  const deleteProduct = async (product: Product) => {
    setBusyId(product.id);
    setListError(null);
    try {
      const { catalogMaintenance } = await getAppServices();
      await catalogMaintenance.deleteProduct({ id: product.id });
      if (form.id === product.id) {
        closeForm();
      }
      await reload();
      notify({
        tone: "success",
        title: "Producto eliminado",
        description: product.name,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar el producto";
      setListError(message);
      notify({ tone: "error", title: "Eliminar producto", description: message });
      throw err;
    } finally {
      setBusyId(null);
    }
  };

  const categoryName = (categoryId: string | null) =>
    categories.find((category) => category.id === categoryId)?.name ?? "—";

  return {
    activeCategories,
    products,
    ingredients,
    form,
    formOpen,
    error,
    listError,
    loading,
    saving,
    uploadingImage,
    busyId,
    setForm,
    closeForm,
    startCreate,
    startEdit,
    onPickImage,
    onSave,
    toggleActive,
    deleteProduct,
    categoryName,
  };
}
