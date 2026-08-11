import type { CellValue, Worksheet, Workbook } from "exceljs";
import {
  CATALOG_WORKBOOK_SHEETS,
  type CatalogWorkbookCategoryDto,
  type CatalogWorkbookDto,
  type CatalogWorkbookFulfillmentType,
  type CatalogWorkbookInventoryDto,
  type CatalogWorkbookProductDto,
  type CatalogWorkbookRecipeDto,
} from "@/domain/catalog/catalog-workbook-dto";
import { CATALOG_WORKBOOK_HEADERS } from "@/infrastructure/excel/catalog-workbook-headers";
import { parseFulfillmentTypeFromExcel } from "@/infrastructure/excel/fulfillment-type-excel";

type HeaderMap = Map<string, number>;

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase();
}

function cellToRaw(value: CellValue): unknown {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }
    if ("result" in value) {
      return value.result ?? null;
    }
    if ("formula" in value) {
      return "result" in value ? (value.result ?? null) : null;
    }
  }
  return String(value);
}

function cellToString(value: CellValue): string {
  const raw = cellToRaw(value);
  if (raw === null || raw === undefined) {
    return "";
  }
  return String(raw).trim();
}

function cellToNumber(value: CellValue): number {
  const raw = cellToRaw(value);
  if (raw === null || raw === undefined || raw === "") {
    return Number.NaN;
  }
  if (typeof raw === "number") {
    return raw;
  }
  if (typeof raw === "boolean") {
    return raw ? 1 : 0;
  }
  const normalized = String(raw).trim().replace(",", ".");
  if (!normalized) {
    return Number.NaN;
  }
  return Number(normalized);
}

function cellToOptionalNumber(value: CellValue): number | null {
  const raw = cellToRaw(value);
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const parsed = cellToNumber(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseSiNo(value: CellValue, defaultValue: boolean): boolean {
  const text = cellToString(value).toLowerCase();
  if (!text) {
    return defaultValue;
  }
  if (["si", "sí", "true", "1", "yes", "y"].includes(text)) {
    return true;
  }
  if (["no", "false", "0", "n"].includes(text)) {
    return false;
  }
  // Unknown token — keep as truthy string presence for the validator to judge.
  return true;
}

function requireSheet(workbook: Workbook, name: string): Worksheet {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) {
    throw new Error(`Falta la hoja requerida "${name}"`);
  }
  return sheet;
}

function readHeaderMap(sheet: Worksheet, required: readonly string[]): HeaderMap {
  const headerRow = sheet.getRow(1);
  const map: HeaderMap = new Map();
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const key = normalizeHeader(cellToString(cell.value));
    if (key) {
      map.set(key, colNumber);
    }
  });

  for (const header of required) {
    if (!map.has(normalizeHeader(header))) {
      throw new Error(
        `Falta la columna requerida "${header}" en la hoja "${sheet.name}"`,
      );
    }
  }

  return map;
}

function isRowEmpty(sheet: Worksheet, rowNumber: number, columns: number[]): boolean {
  return columns.every((col) => cellToString(sheet.getCell(rowNumber, col).value) === "");
}

function getCell(
  sheet: Worksheet,
  rowNumber: number,
  headers: HeaderMap,
  header: string,
): CellValue {
  const col = headers.get(normalizeHeader(header));
  if (!col) {
    return null;
  }
  return sheet.getCell(rowNumber, col).value;
}

function iterateDataRows(
  sheet: Worksheet,
  headers: HeaderMap,
  mapRow: (rowNumber: number) => unknown,
): unknown[] {
  const columns = [...headers.values()];
  const rows: unknown[] = [];
  const lastRow = Math.max(sheet.rowCount, 1);

  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    if (isRowEmpty(sheet, rowNumber, columns)) {
      continue;
    }
    rows.push(mapRow(rowNumber));
  }

  return rows;
}

function parseCategories(sheet: Worksheet): CatalogWorkbookCategoryDto[] {
  const headers = readHeaderMap(sheet, CATALOG_WORKBOOK_HEADERS.categories);
  return iterateDataRows(sheet, headers, (rowNumber) => ({
    code: cellToString(getCell(sheet, rowNumber, headers, "codigo")),
    name: cellToString(getCell(sheet, rowNumber, headers, "nombre")),
    active: true,
    sortOrder: 0,
  })) as CatalogWorkbookCategoryDto[];
}

function parseInventory(sheet: Worksheet): CatalogWorkbookInventoryDto[] {
  const headers = readHeaderMap(sheet, CATALOG_WORKBOOK_HEADERS.inventory);
  return iterateDataRows(sheet, headers, (rowNumber) => ({
    code: cellToString(getCell(sheet, rowNumber, headers, "codigo")),
    name: cellToString(getCell(sheet, rowNumber, headers, "nombre")),
    unit: cellToString(getCell(sheet, rowNumber, headers, "unidad")),
    stockQuantity: cellToOptionalNumber(getCell(sheet, rowNumber, headers, "stock")),
    minStock: cellToNumber(getCell(sheet, rowNumber, headers, "stock_minimo")),
    active: true,
    updateStock: parseSiNo(getCell(sheet, rowNumber, headers, "actualizar_stock"), false),
  })) as CatalogWorkbookInventoryDto[];
}

function parseProducts(sheet: Worksheet): CatalogWorkbookProductDto[] {
  const headers = readHeaderMap(sheet, CATALOG_WORKBOOK_HEADERS.products);
  return iterateDataRows(sheet, headers, (rowNumber) => {
    const fulfillmentRaw = cellToString(getCell(sheet, rowNumber, headers, "tipo"));
    const fulfillmentParsed = parseFulfillmentTypeFromExcel(fulfillmentRaw);
    const inventoryCode = cellToString(
      getCell(sheet, rowNumber, headers, "inventario_codigo"),
    );
    const qtyPerSale = cellToOptionalNumber(
      getCell(sheet, rowNumber, headers, "cantidad_por_venta"),
    );

    return {
      code: cellToString(getCell(sheet, rowNumber, headers, "codigo")),
      name: cellToString(getCell(sheet, rowNumber, headers, "nombre")),
      categoryCode: cellToString(getCell(sheet, rowNumber, headers, "categoria_codigo")),
      fulfillmentType: (fulfillmentParsed ??
        fulfillmentRaw) as CatalogWorkbookFulfillmentType,
      pricePesos: cellToNumber(getCell(sheet, rowNumber, headers, "precio")),
      costPesos: cellToOptionalNumber(getCell(sheet, rowNumber, headers, "costo")),
      active: parseSiNo(getCell(sheet, rowNumber, headers, "activo"), true),
      inventoryCode: inventoryCode === "" ? null : inventoryCode,
      qtyPerSale,
    };
  }) as CatalogWorkbookProductDto[];
}

function parseRecipes(sheet: Worksheet): CatalogWorkbookRecipeDto[] {
  const headers = readHeaderMap(sheet, CATALOG_WORKBOOK_HEADERS.recipes);
  return iterateDataRows(sheet, headers, (rowNumber) => ({
    productCode: cellToString(getCell(sheet, rowNumber, headers, "producto_codigo")),
    inventoryCode: cellToString(getCell(sheet, rowNumber, headers, "inventario_codigo")),
    quantity: cellToNumber(getCell(sheet, rowNumber, headers, "cantidad")),
  })) as CatalogWorkbookRecipeDto[];
}

/** Structural XLSX → DTO mapping. No business validation. */
export function parseCatalogWorkbook(workbook: Workbook): CatalogWorkbookDto {
  requireSheet(workbook, CATALOG_WORKBOOK_SHEETS.instructions);

  return {
    categories: parseCategories(
      requireSheet(workbook, CATALOG_WORKBOOK_SHEETS.categories),
    ),
    inventory: parseInventory(requireSheet(workbook, CATALOG_WORKBOOK_SHEETS.inventory)),
    products: parseProducts(requireSheet(workbook, CATALOG_WORKBOOK_SHEETS.products)),
    recipes: parseRecipes(requireSheet(workbook, CATALOG_WORKBOOK_SHEETS.recipes)),
  };
}
