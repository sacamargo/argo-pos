/**
 * Excel workbook DTOs — catalog import/export contract.
 * Independent from domain entities; references use business `code`, not UUID.
 */

export type CatalogWorkbookFulfillmentType = "simple" | "compound";

/** Sheet: Categorias */
export type CatalogWorkbookCategoryDto = {
  code: string;
  name: string;
  active: boolean;
  sortOrder: number;
};

/** Sheet: Inventario */
export type CatalogWorkbookInventoryDto = {
  code: string;
  name: string;
  unit: string;
  minStock: number;
  /** Export value; import only applies when updateStock is true. */
  stockQuantity: number | null;
  active: boolean;
  /** Maps Excel column actualizar_stock (si/no). Default false on parse. */
  updateStock: boolean;
};

/** Sheet: Productos */
export type CatalogWorkbookProductDto = {
  code: string;
  name: string;
  categoryCode: string;
  fulfillmentType: CatalogWorkbookFulfillmentType;
  /** Human price in COP pesos (Excel column); domain uses cents after validate/apply. */
  pricePesos: number;
  /** Optional cost in COP pesos; null/empty = unknown. */
  costPesos: number | null;
  active: boolean;
  /** Required for simple; null for compound. */
  inventoryCode: string | null;
  /** Required for simple; null for compound. */
  qtyPerSale: number | null;
};

/** Sheet: Recetas (compound products only) */
export type CatalogWorkbookRecipeDto = {
  productCode: string;
  inventoryCode: string;
  quantity: number;
};

/** Full workbook payload after parse / before export. */
export type CatalogWorkbookDto = {
  categories: CatalogWorkbookCategoryDto[];
  inventory: CatalogWorkbookInventoryDto[];
  products: CatalogWorkbookProductDto[];
  recipes: CatalogWorkbookRecipeDto[];
};

/** Stable sheet names for the catalog workbook (do not rename without migration). */
export const CATALOG_WORKBOOK_SHEETS = {
  instructions: "0_Instrucciones",
  categories: "Categorias",
  inventory: "Inventario",
  products: "Productos",
  recipes: "Recetas",
} as const;

export type CatalogWorkbookSheetName =
  (typeof CATALOG_WORKBOOK_SHEETS)[keyof typeof CATALOG_WORKBOOK_SHEETS];
