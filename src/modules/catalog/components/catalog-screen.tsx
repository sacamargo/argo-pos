import { useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { Category } from "@/domain/entities/category";
import { Button } from "@/components";
import { CatalogExcelScreen } from "@/modules/catalog/components/catalog-excel-screen";
import { CategoriesScreen } from "@/modules/catalog/components/categories-screen";
import { ProductsScreen } from "@/modules/catalog/components/products-screen";
import { cn } from "@/shared/lib/cn";

type CatalogTab = "products" | "categories" | "excel";

export function CatalogScreen() {
  const [tab, setTab] = useState<CatalogTab>("products");
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getAppServices()
      .then(({ categories: categoryService }) => categoryService.listAll())
      .then((rows) => {
        if (!cancelled) {
          setCategories(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Lo que se vende en el POS. Simple = empaquetado (crea stock aquí). Compuesto =
          granizado u otro armado (insumos en Inventario + receta aquí).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={tab === "products" ? "default" : "outline"}
          className={cn("h-11")}
          onClick={() => setTab("products")}
        >
          Productos
        </Button>
        <Button
          variant={tab === "categories" ? "default" : "outline"}
          className={cn("h-11")}
          onClick={() => setTab("categories")}
        >
          Categorías
        </Button>
        <Button
          variant={tab === "excel" ? "default" : "outline"}
          className={cn("h-11")}
          onClick={() => setTab("excel")}
        >
          Excel
        </Button>
      </div>

      {tab === "products" ? <ProductsScreen categories={categories} /> : null}
      {tab === "categories" ? <CategoriesScreen /> : null}
      {tab === "excel" ? <CatalogExcelScreen /> : null}
    </div>
  );
}
