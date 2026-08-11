/** Stable Excel column headers for the catalog workbook (Spanish sheet contract). */
export const CATALOG_WORKBOOK_HEADERS = {
  categories: ["codigo", "nombre"] as const,
  inventory: [
    "codigo",
    "nombre",
    "unidad",
    "stock",
    "stock_minimo",
    "actualizar_stock",
  ] as const,
  products: [
    "codigo",
    "nombre",
    "categoria_codigo",
    "tipo",
    "inventario_codigo",
    "cantidad_por_venta",
    "precio",
    "costo",
    "activo",
  ] as const,
  recipes: ["producto_codigo", "inventario_codigo", "cantidad"] as const,
} as const;
