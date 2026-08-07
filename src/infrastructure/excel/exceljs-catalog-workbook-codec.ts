import type { Worksheet, Workbook } from "exceljs";
import type { CatalogWorkbookCodec } from "@/domain/catalog/catalog-workbook-codec";
import {
  CATALOG_WORKBOOK_SHEETS,
  type CatalogWorkbookDto,
} from "@/domain/catalog/catalog-workbook-dto";
import { CATALOG_WORKBOOK_HEADERS } from "@/infrastructure/excel/catalog-workbook-headers";

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
  "- Es un identificador interno del sistema (no lo inventes a mano en el día a día).",
  "- En altas nuevas normalmente déjala vacía: el sistema generará el código.",
  "- En importaciones futuras, un codigo existente permite actualizar ese registro (upsert).",
  "",
  "Productos:",
  "- tipo = simple → un solo ítem de inventario (inventario_codigo + cantidad_por_venta).",
  "- tipo = compound → se arma con filas en la hoja Recetas (deja inventario_codigo vacío).",
  "",
  "Inventario:",
  "- actualizar_stock = si → al importar se podrá aplicar el stock de la fila.",
  "- actualizar_stock = no (o vacío) → el stock existente no se pisa.",
  "",
  "Orden sugerido al completar el archivo: Categorias → Inventario → Productos → Recetas.",
] as const;

const CATEGORY_WIDTHS = [16, 28];
const INVENTORY_WIDTHS = [16, 28, 10, 12, 14, 16];
const PRODUCT_WIDTHS = [16, 28, 18, 12, 18, 18, 12, 10];
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
    void bytes;
    throw new Error("CatalogWorkbookCodec.parse is not implemented yet");
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
    workbook
      .getWorksheet(CATALOG_WORKBOOK_SHEETS.categories)
      ?.addRow(["", "Granizados"]);
    workbook
      .getWorksheet(CATALOG_WORKBOOK_SHEETS.inventory)
      ?.addRow(["", "Base limón", "ml", 5000, 500, "no"]);
    const products = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.products);
    products?.addRow(["", "Agua 600ml", "", "simple", "", 1, 2500, "si"]);
    products?.addRow(["", "Granizado limón", "", "compound", "", "", 8000, "si"]);
    workbook
      .getWorksheet(CATALOG_WORKBOOK_SHEETS.recipes)
      ?.addRow(["", "", 250]);
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
        row.fulfillmentType,
        isSimple ? emptyIfNull(row.inventoryCode) : "",
        isSimple ? emptyIfNull(row.qtyPerSale) : "",
        row.pricePesos,
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
