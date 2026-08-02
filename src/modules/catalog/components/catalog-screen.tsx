import { useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { Category } from "@/domain/entities/category";
import { Button } from "@/components";
import { CategoriesScreen } from "@/modules/catalog/components/categories-screen";
import { ProductsScreen } from "@/modules/catalog/components/products-screen";
import { cn } from "@/shared/lib/cn";

type CatalogTab = "products" | "categories";

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
        <p className="text-sm text-muted-foreground">Productos, categorías y recetas.</p>
      </div>

      <div className="flex gap-2">
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
      </div>

      {tab === "products" ? (
        <ProductsScreen categories={categories} />
      ) : (
        <CategoriesScreen />
      )}
    </div>
  );
}
