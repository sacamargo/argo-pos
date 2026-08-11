import type { Worksheet, Workbook } from "exceljs";
import type { CatalogWorkbookCodec } from "@/domain/catalog/catalog-workbook-codec";
import {
  CATALOG_WORKBOOK_SHEETS,
  type CatalogWorkbookDto,
} from "@/domain/catalog/catalog-workbook-dto";
import { CATALOG_WORKBOOK_HEADERS } from "@/infrastructure/excel/catalog-workbook-headers";
import { parseCatalogWorkbook } from "@/infrastructure/excel/catalog-workbook-parse";
import { fulfillmentTypeToExcel } from "@/infrastructure/excel/fulfillment-type-excel";

type ExcelJsApi = {
  Workbook: new () => Workbook;
};

const INSTRUCTION_LINES = [
  "Plantilla oficial de catálogo — Argo POS",
  "",
  "Reglas importantes:",
  "1. No cambies los nombres de las hojas.",
  "2. No elimines columnas ni modifiques los encabezados (fila 1).",
  "3. Una fila = un registro.",
  "",
  "Columna codigo:",
  "- Es un identificador interno del sistema (no lo uses en el día a día).",
  "- En altas nuevas normalmente déjala vacía: el sistema generará el código.",
  "- En importaciones futuras, un codigo existente actualiza ese registro (upsert).",
  "- Si un producto Compuesto trae receta en el mismo archivo, pon codigo en Productos e Inventario para poder enlazarlos en Recetas.",
  "",
  "Productos — columna tipo (escribe exactamente así):",
  "- Simple → se vende tal cual (1 ítem de inventario). Llena inventario_codigo y cantidad_por_venta.",
  "- Compuesto → se arma con receta (varios ítems). Déjalos vacíos y completa la hoja Recetas.",
  "",
  "Ejemplo incluido (filas con codigo EJ-...):",
  "- Doritos = Simple: al vender se descuenta 1 und del inventario Doritos.",
  "- Granizado mora = Compuesto: vaso + pajita + sticker + base de sabor (ml) + dulces.",
  "- Cada venta del granizado descuenta todos los ítems listados en Recetas.",
  "- Columna costo (opcional): costo en pesos COP. Vacío = sin costo (ganancia parcial).",
  "- Puedes borrar las filas EJ-... o adaptarlas a tu negocio.",
  "",
  "Inventario — unidades sugeridas:",
  "- und (Doritos, vaso, pajita, sticker, dulces), ml (jarabes / bases), g, oz, caja.",
  "",
  "Inventario — actualizar_stock:",
  "- si → al importar se aplica el stock de la fila.",
  "- no (o vacío) → no se pisa el stock existente.",
  "",
  "Orden sugerido: Categorias → Inventario → Productos → Recetas.",
] as const;

const CATEGORY_WIDTHS = [16, 28];
const INVENTORY_WIDTHS = [16, 28, 10, 12, 14, 16];
const PRODUCT_WIDTHS = [16, 28, 18, 12, 18, 18, 12, 12, 10];
const RECIPE_WIDTHS = [20, 20, 12];

function boolSiNo(value: boolean): "si" | "no" {
  return value ? "si" : "no";
}

function emptyIfNull(value: string | number | null | undefined): string | number {
  return value ?? "";
}

/**
 * ExcelJS adapter for CatalogWorkbookCodec.
 *
 * exceljs loads via dynamic import() so POS startup does not pay the Excel cost.
 */
export class ExcelJsCatalogWorkbookCodec implements CatalogWorkbookCodec {
  private exceljsPromise: Promise<ExcelJsApi> | null = null;

  private loadExcelJS(): Promise<ExcelJsApi> {
    if (!this.exceljsPromise) {
      this.exceljsPromise = import("exceljs").then((mod) => {
        const api = (mod as { default?: ExcelJsApi }).default ?? (mod as ExcelJsApi);
        return api;
      });
    }
    return this.exceljsPromise;
  }

  async buildTemplate(): Promise<Uint8Array> {
    const workbook = await this.createBaseWorkbook();
    this.fillTemplateExamples(workbook);
    return this.writeBytes(workbook);
  }

  async buildExport(data: CatalogWorkbookDto): Promise<Uint8Array> {
    const workbook = await this.createBaseWorkbook();
    this.fillExportData(workbook, data);
    return this.writeBytes(workbook);
  }

  async parse(bytes: Uint8Array): Promise<CatalogWorkbookDto> {
    const ExcelJS = await this.loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    );
    await workbook.xlsx.load(arrayBuffer);
    return parseCatalogWorkbook(workbook);
  }

  private async createBaseWorkbook(): Promise<Workbook> {
    const ExcelJS = await this.loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Argo POS";
    workbook.created = new Date();

    await this.addInstructionsSheet(workbook);
    this.styleDataSheet(
      workbook.addWorksheet(CATALOG_WORKBOOK_SHEETS.categories),
      [...CATALOG_WORKBOOK_HEADERS.categories],
      CATEGORY_WIDTHS,
    );
    this.styleDataSheet(
      workbook.addWorksheet(CATALOG_WORKBOOK_SHEETS.inventory),
      [...CATALOG_WORKBOOK_HEADERS.inventory],
      INVENTORY_WIDTHS,
    );
    this.styleDataSheet(
      workbook.addWorksheet(CATALOG_WORKBOOK_SHEETS.products),
      [...CATALOG_WORKBOOK_HEADERS.products],
      PRODUCT_WIDTHS,
    );
    this.styleDataSheet(
      workbook.addWorksheet(CATALOG_WORKBOOK_SHEETS.recipes),
      [...CATALOG_WORKBOOK_HEADERS.recipes],
      RECIPE_WIDTHS,
    );

    return workbook;
  }

  private async writeBytes(workbook: Workbook): Promise<Uint8Array> {
    const buffer = await workbook.xlsx.writeBuffer();
    return new Uint8Array(buffer);
  }

  private fillTemplateExamples(workbook: Workbook): void {
    const categories = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.categories);
    categories?.addRow(["EJ-CAT-GRAN", "Granizados"]);
    categories?.addRow(["EJ-CAT-SNACK", "Snacks"]);

    const inventory = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.inventory);
    inventory?.addRow(["EJ-INV-VASO16", "Vaso 16 oz", "und", 200, 50, "no"]);
    inventory?.addRow(["EJ-INV-PAJITA", "Pajita", "und", 500, 100, "no"]);
    inventory?.addRow(["EJ-INV-STICKER", "Sticker marca", "und", 500, 100, "no"]);
    inventory?.addRow(["EJ-INV-BASE-MORA", "Base sabor mora", "ml", 10000, 1000, "no"]);
    inventory?.addRow(["EJ-INV-DULCES", "Dulces surtidos", "und", 300, 50, "no"]);
    inventory?.addRow(["EJ-INV-DORITOS", "Doritos", "und", 48, 12, "no"]);

    const products = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.products);
    products?.addRow([
      "EJ-PROD-DORITOS",
      "Doritos",
      "EJ-CAT-SNACK",
      "Simple",
      "EJ-INV-DORITOS",
      1,
      3500,
      2000,
      "si",
    ]);
    products?.addRow([
      "EJ-PROD-GRAN-MORA",
      "Granizado mora",
      "EJ-CAT-GRAN",
      "Compuesto",
      "",
      "",
      12000,
      "",
      "si",
    ]);

    const recipes = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.recipes);
    recipes?.addRow(["EJ-PROD-GRAN-MORA", "EJ-INV-VASO16", 1]);
    recipes?.addRow(["EJ-PROD-GRAN-MORA", "EJ-INV-PAJITA", 1]);
    recipes?.addRow(["EJ-PROD-GRAN-MORA", "EJ-INV-STICKER", 1]);
    recipes?.addRow(["EJ-PROD-GRAN-MORA", "EJ-INV-BASE-MORA", 250]);
    recipes?.addRow(["EJ-PROD-GRAN-MORA", "EJ-INV-DULCES", 3]);
  }

  private fillExportData(workbook: Workbook, data: CatalogWorkbookDto): void {
    const categories = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.categories);
    for (const row of data.categories) {
      categories?.addRow([row.code, row.name]);
    }

    const inventory = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.inventory);
    for (const row of data.inventory) {
      inventory?.addRow([
        row.code,
        row.name,
        row.unit,
        emptyIfNull(row.stockQuantity),
        row.minStock,
        boolSiNo(row.updateStock),
      ]);
    }

    const products = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.products);
    for (const row of data.products) {
      const isSimple = row.fulfillmentType === "simple";
      products?.addRow([
        row.code,
        row.name,
        row.categoryCode,
        fulfillmentTypeToExcel(row.fulfillmentType),
        isSimple ? emptyIfNull(row.inventoryCode) : "",
        isSimple ? emptyIfNull(row.qtyPerSale) : "",
        row.pricePesos,
        emptyIfNull(row.costPesos),
        boolSiNo(row.active),
      ]);
    }

    const recipes = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.recipes);
    for (const row of data.recipes) {
      recipes?.addRow([row.productCode, row.inventoryCode, row.quantity]);
    }
  }

  private async addInstructionsSheet(workbook: Workbook): Promise<void> {
    const sheet = workbook.addWorksheet(CATALOG_WORKBOOK_SHEETS.instructions);
    for (const [index, line] of INSTRUCTION_LINES.entries()) {
      sheet.getCell(index + 1, 1).value = line;
    }
    sheet.getColumn(1).width = 96;
    sheet.getRow(1).font = { bold: true, size: 14 };
    try {
      await sheet.protect("", {
        selectLockedCells: true,
        selectUnlockedCells: true,
      });
    } catch {
      // Protection is best-effort; template remains usable without it.
    }
  }

  private styleDataSheet(
    sheet: Worksheet,
    headers: string[],
    widths: number[],
  ): void {
    sheet.addRow(headers);
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.commit();
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: headers.length },
    };
    widths.forEach((width, index) => {
      sheet.getColumn(index + 1).width = width;
    });
  }
}
