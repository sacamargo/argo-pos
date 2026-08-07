import type { CatalogWorkbookFulfillmentType } from "@/domain/catalog/catalog-workbook-dto";

/** Valores visibles en Excel (columna tipo). Dominio interno sigue en inglés. */
export type ExcelFulfillmentLabel = "Simple" | "Compuesto";

export function fulfillmentTypeToExcel(
  type: CatalogWorkbookFulfillmentType,
): ExcelFulfillmentLabel {
  return type === "compound" ? "Compuesto" : "Simple";
}

/**
 * Acepta etiquetas en español y valores legacy en inglés.
 * Devuelve null si el texto no es un tipo reconocido.
 */
export function parseFulfillmentTypeFromExcel(
  raw: string,
): CatalogWorkbookFulfillmentType | null {
  const normalized = raw.trim().toLowerCase();
  if (normalized === "simple") {
    return "simple";
  }
  if (normalized === "compuesto" || normalized === "compound") {
    return "compound";
  }
  return null;
}
