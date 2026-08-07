import type { Category } from "@/domain/entities/category";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { ProductWithRecipe } from "@/domain/entities/product";

/**
 * Full catalog snapshot used by future Excel export/import.
 * Stable shape — Excel codec will map to/from workbook sheets.
 */
export type CatalogSnapshot = {
  categories: Category[];
  inventory: Ingredient[];
  products: ProductWithRecipe[];
};
