import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import type { CatalogWorkbookCodec } from "@/domain/catalog/catalog-workbook-codec";
import {
  CATALOG_WORKBOOK_SHEETS,
  type CatalogWorkbookDto,
} from "@/domain/catalog/catalog-workbook-dto";
import { CATALOG_WORKBOOK_HEADERS } from "@/infrastructure/excel/catalog-workbook-headers";
import { ExcelJsCatalogWorkbookCodec } from "@/infrastructure/excel/exceljs-catalog-workbook-codec";

async function loadBytes(bytes: Uint8Array) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(bytes));
  return workbook;
}

async function loadTemplateWorkbook() {
  const codec = new ExcelJsCatalogWorkbookCodec();
  const bytes = await codec.buildTemplate();
  return { bytes, workbook: await loadBytes(bytes) };
}

async function loadExportWorkbook(data: CatalogWorkbookDto) {
  const codec = new ExcelJsCatalogWorkbookCodec();
  const bytes = await codec.buildExport(data);
  return { bytes, workbook: await loadBytes(bytes) };
}

function headerValues(sheet: ExcelJS.Worksheet): string[] {
  const row = sheet.getRow(1);
  const values: string[] = [];
  row.eachCell({ includeEmpty: false }, (cell, col) => {
    values[col - 1] = String(cell.value ?? "");
  });
  return values;
}

function cell(sheet: ExcelJS.Worksheet, row: number, col: number): string | number {
  const value = sheet.getCell(row, col).value;
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number") {
    return value;
  }
  return String(value);
}

const emptyDto: CatalogWorkbookDto = {
  categories: [],
  inventory: [],
  products: [],
  recipes: [],
};

describe("ExcelJsCatalogWorkbookCodec", () => {
  it("can be instantiated", () => {
    const codec = new ExcelJsCatalogWorkbookCodec();
    expect(codec).toBeInstanceOf(ExcelJsCatalogWorkbookCodec);
  });

  it("satisfies the CatalogWorkbookCodec port", () => {
    const codec: CatalogWorkbookCodec = new ExcelJsCatalogWorkbookCodec();
    expect(typeof codec.buildTemplate).toBe("function");
    expect(typeof codec.buildExport).toBe("function");
    expect(typeof codec.parse).toBe("function");
  });

  it("exposes stable sheet name contract", () => {
    expect(CATALOG_WORKBOOK_SHEETS.instructions).toBe("0_Instrucciones");
    expect(CATALOG_WORKBOOK_SHEETS.categories).toBe("Categorias");
    expect(CATALOG_WORKBOOK_SHEETS.inventory).toBe("Inventario");
    expect(CATALOG_WORKBOOK_SHEETS.products).toBe("Productos");
    expect(CATALOG_WORKBOOK_SHEETS.recipes).toBe("Recetas");
  });

  it("buildTemplate returns a valid xlsx Uint8Array with five sheets", async () => {
    const { bytes, workbook } = await loadTemplateWorkbook();

    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.byteLength).toBeGreaterThan(100);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);

    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      CATALOG_WORKBOOK_SHEETS.instructions,
      CATALOG_WORKBOOK_SHEETS.categories,
      CATALOG_WORKBOOK_SHEETS.inventory,
      CATALOG_WORKBOOK_SHEETS.products,
      CATALOG_WORKBOOK_SHEETS.recipes,
    ]);
  });

  it("buildTemplate writes correct headers and example rows", async () => {
    const { workbook } = await loadTemplateWorkbook();

    const categories = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.categories)!;
    const inventory = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.inventory)!;
    const products = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.products)!;
    const recipes = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.recipes)!;
    const instructions = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.instructions)!;

    expect(headerValues(categories)).toEqual([...CATALOG_WORKBOOK_HEADERS.categories]);
    expect(headerValues(inventory)).toEqual([...CATALOG_WORKBOOK_HEADERS.inventory]);
    expect(headerValues(products)).toEqual([...CATALOG_WORKBOOK_HEADERS.products]);
    expect(headerValues(recipes)).toEqual([...CATALOG_WORKBOOK_HEADERS.recipes]);

    expect(String(categories.getCell(2, 2).value)).toContain("Granizados");
    expect(String(inventory.getCell(2, 2).value)).toContain("Base limón");
    expect(String(products.getCell(2, 4).value)).toBe("simple");
    expect(String(products.getCell(3, 4).value)).toBe("compound");
    expect(Number(recipes.getCell(2, 3).value)).toBe(250);
    expect(String(instructions.getCell(1, 1).value)).toMatch(/Argo POS/i);
  });

  describe("buildExport", () => {
    it("exports an empty catalog with headers only", async () => {
      const { bytes, workbook } = await loadExportWorkbook(emptyDto);

      expect(bytes[0]).toBe(0x50);
      expect(bytes[1]).toBe(0x4b);
      expect(workbook.worksheets).toHaveLength(5);

      const categories = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.categories)!;
      expect(headerValues(categories)).toEqual([...CATALOG_WORKBOOK_HEADERS.categories]);
      expect(categories.rowCount).toBe(1);
    });

    it("exports categories", async () => {
      const { workbook } = await loadExportWorkbook({
        ...emptyDto,
        categories: [
          { code: "CAT-A1", name: "Bebidas", active: true, sortOrder: 1 },
        ],
      });
      const sheet = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.categories)!;
      expect(cell(sheet, 2, 1)).toBe("CAT-A1");
      expect(cell(sheet, 2, 2)).toBe("Bebidas");
    });

    it("exports inventory", async () => {
      const { workbook } = await loadExportWorkbook({
        ...emptyDto,
        inventory: [
          {
            code: "INV-B1",
            name: "Vaso",
            unit: "und",
            stockQuantity: 40,
            minStock: 5,
            active: true,
            updateStock: false,
          },
        ],
      });
      const sheet = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.inventory)!;
      expect(cell(sheet, 2, 1)).toBe("INV-B1");
      expect(cell(sheet, 2, 2)).toBe("Vaso");
      expect(cell(sheet, 2, 3)).toBe("und");
      expect(cell(sheet, 2, 4)).toBe(40);
      expect(cell(sheet, 2, 5)).toBe(5);
      expect(cell(sheet, 2, 6)).toBe("no");
    });

    it("exports a simple product with inventory link", async () => {
      const { workbook } = await loadExportWorkbook({
        ...emptyDto,
        products: [
          {
            code: "PROD-S1",
            name: "Agua",
            categoryCode: "CAT-A1",
            fulfillmentType: "simple",
            pricePesos: 2500,
            active: true,
            inventoryCode: "INV-B1",
            qtyPerSale: 1,
          },
        ],
      });
      const sheet = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.products)!;
      expect(cell(sheet, 2, 1)).toBe("PROD-S1");
      expect(cell(sheet, 2, 4)).toBe("simple");
      expect(cell(sheet, 2, 5)).toBe("INV-B1");
      expect(cell(sheet, 2, 6)).toBe(1);
      expect(cell(sheet, 2, 7)).toBe(2500);
      expect(cell(sheet, 2, 8)).toBe("si");
    });

    it("exports a compound product without inventory link", async () => {
      const { workbook } = await loadExportWorkbook({
        ...emptyDto,
        products: [
          {
            code: "PROD-C1",
            name: "Granizado",
            categoryCode: "CAT-A1",
            fulfillmentType: "compound",
            pricePesos: 8000,
            active: true,
            inventoryCode: "INV-SHOULD-IGNORE",
            qtyPerSale: 99,
          },
        ],
      });
      const sheet = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.products)!;
      expect(cell(sheet, 2, 4)).toBe("compound");
      expect(cell(sheet, 2, 5)).toBe("");
      expect(cell(sheet, 2, 6)).toBe("");
      expect(cell(sheet, 2, 7)).toBe(8000);
    });

    it("exports recipe rows", async () => {
      const { workbook } = await loadExportWorkbook({
        ...emptyDto,
        recipes: [
          { productCode: "PROD-C1", inventoryCode: "INV-B1", quantity: 250 },
          { productCode: "PROD-C1", inventoryCode: "INV-B2", quantity: 1 },
        ],
      });
      const sheet = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.recipes)!;
      expect(cell(sheet, 2, 1)).toBe("PROD-C1");
      expect(cell(sheet, 2, 2)).toBe("INV-B1");
      expect(cell(sheet, 2, 3)).toBe(250);
      expect(cell(sheet, 3, 2)).toBe("INV-B2");
      expect(cell(sheet, 3, 3)).toBe(1);
    });
  });

  describe("parse", () => {
    const codec = new ExcelJsCatalogWorkbookCodec();

    async function workbookToBytes(workbook: ExcelJS.Workbook): Promise<Uint8Array> {
      const buffer = await workbook.xlsx.writeBuffer();
      return new Uint8Array(buffer);
    }

    function addRequiredSheets(workbook: ExcelJS.Workbook) {
      workbook.addWorksheet(CATALOG_WORKBOOK_SHEETS.instructions);
      for (const [name, headers] of [
        [CATALOG_WORKBOOK_SHEETS.categories, CATALOG_WORKBOOK_HEADERS.categories],
        [CATALOG_WORKBOOK_SHEETS.inventory, CATALOG_WORKBOOK_HEADERS.inventory],
        [CATALOG_WORKBOOK_SHEETS.products, CATALOG_WORKBOOK_HEADERS.products],
        [CATALOG_WORKBOOK_SHEETS.recipes, CATALOG_WORKBOOK_HEADERS.recipes],
      ] as const) {
        const sheet = workbook.addWorksheet(name);
        sheet.addRow([...headers]);
      }
    }

    it("parses a valid exported workbook (round-trip)", async () => {
      const source: CatalogWorkbookDto = {
        categories: [
          { code: "CAT-A1", name: "Bebidas", active: true, sortOrder: 0 },
        ],
        inventory: [
          {
            code: "INV-B1",
            name: "Vaso",
            unit: "und",
            stockQuantity: 40,
            minStock: 5,
            active: true,
            updateStock: false,
          },
        ],
        products: [
          {
            code: "PROD-S1",
            name: "Agua",
            categoryCode: "CAT-A1",
            fulfillmentType: "simple",
            pricePesos: 2500,
            active: true,
            inventoryCode: "INV-B1",
            qtyPerSale: 1,
          },
        ],
        recipes: [],
      };

      const bytes = await codec.buildExport(source);
      const parsed = await codec.parse(bytes);

      expect(parsed.categories).toEqual([
        { code: "CAT-A1", name: "Bebidas", active: true, sortOrder: 0 },
      ]);
      expect(parsed.inventory[0]).toMatchObject({
        code: "INV-B1",
        name: "Vaso",
        unit: "und",
        stockQuantity: 40,
        minStock: 5,
        updateStock: false,
      });
      expect(parsed.products[0]).toMatchObject({
        code: "PROD-S1",
        fulfillmentType: "simple",
        inventoryCode: "INV-B1",
        qtyPerSale: 1,
        pricePesos: 2500,
      });
      expect(parsed.recipes).toEqual([]);
    });

    it("parses an empty workbook", async () => {
      const bytes = await codec.buildExport(emptyDto);
      const parsed = await codec.parse(bytes);
      expect(parsed).toEqual(emptyDto);
    });

    it("ignores fully empty rows", async () => {
      const workbook = new ExcelJS.Workbook();
      addRequiredSheets(workbook);
      const categories = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.categories)!;
      categories.addRow(["", ""]);
      categories.addRow(["CAT-X", "Extras"]);
      categories.addRow(["", ""]);

      const parsed = await codec.parse(await workbookToBytes(workbook));
      expect(parsed.categories).toEqual([
        { code: "CAT-X", name: "Extras", active: true, sortOrder: 0 },
      ]);
    });

    it("throws when a required sheet is missing", async () => {
      const workbook = new ExcelJS.Workbook();
      workbook.addWorksheet(CATALOG_WORKBOOK_SHEETS.instructions);
      workbook.addWorksheet(CATALOG_WORKBOOK_SHEETS.categories).addRow([
        ...CATALOG_WORKBOOK_HEADERS.categories,
      ]);
      workbook.addWorksheet(CATALOG_WORKBOOK_SHEETS.inventory).addRow([
        ...CATALOG_WORKBOOK_HEADERS.inventory,
      ]);
      workbook.addWorksheet(CATALOG_WORKBOOK_SHEETS.products).addRow([
        ...CATALOG_WORKBOOK_HEADERS.products,
      ]);
      // recipes missing

      await expect(codec.parse(await workbookToBytes(workbook))).rejects.toThrow(
        /Falta la hoja requerida "Recetas"/,
      );
    });

    it("throws when a required column is missing", async () => {
      const workbook = new ExcelJS.Workbook();
      addRequiredSheets(workbook);
      const categories = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.categories)!;
      categories.spliceRows(1, 1, ["codigo"]); // missing nombre

      await expect(codec.parse(await workbookToBytes(workbook))).rejects.toThrow(
        /Falta la columna requerida "nombre"/,
      );
    });

    it("parses a simple product", async () => {
      const bytes = await codec.buildExport({
        ...emptyDto,
        products: [
          {
            code: "PROD-S1",
            name: "Agua",
            categoryCode: "CAT-A1",
            fulfillmentType: "simple",
            pricePesos: 2500,
            active: true,
            inventoryCode: "INV-B1",
            qtyPerSale: 1,
          },
        ],
      });
      const parsed = await codec.parse(bytes);
      expect(parsed.products).toHaveLength(1);
      expect(parsed.products[0]?.fulfillmentType).toBe("simple");
      expect(parsed.products[0]?.inventoryCode).toBe("INV-B1");
      expect(parsed.products[0]?.qtyPerSale).toBe(1);
    });

    it("parses a compound product", async () => {
      const bytes = await codec.buildExport({
        ...emptyDto,
        products: [
          {
            code: "PROD-C1",
            name: "Granizado",
            categoryCode: "CAT-A1",
            fulfillmentType: "compound",
            pricePesos: 8000,
            active: true,
            inventoryCode: null,
            qtyPerSale: null,
          },
        ],
      });
      const parsed = await codec.parse(bytes);
      expect(parsed.products[0]?.fulfillmentType).toBe("compound");
      expect(parsed.products[0]?.inventoryCode).toBeNull();
      expect(parsed.products[0]?.qtyPerSale).toBeNull();
    });

    it("parses multiple recipe rows", async () => {
      const bytes = await codec.buildExport({
        ...emptyDto,
        recipes: [
          { productCode: "PROD-C1", inventoryCode: "INV-B1", quantity: 250 },
          { productCode: "PROD-C1", inventoryCode: "INV-B2", quantity: 1 },
        ],
      });
      const parsed = await codec.parse(bytes);
      expect(parsed.recipes).toEqual([
        { productCode: "PROD-C1", inventoryCode: "INV-B1", quantity: 250 },
        { productCode: "PROD-C1", inventoryCode: "INV-B2", quantity: 1 },
      ]);
    });

    it("preserves tildes and special characters", async () => {
      const bytes = await codec.buildExport({
        ...emptyDto,
        categories: [
          { code: "CAT-Ñ", name: "Bebidas no alcohólicas", active: true, sortOrder: 0 },
        ],
        inventory: [
          {
            code: "INV-1",
            name: "Base limón — ñoño",
            unit: "ml",
            stockQuantity: 10,
            minStock: 1,
            active: true,
            updateStock: true,
          },
        ],
      });
      const parsed = await codec.parse(bytes);
      expect(parsed.categories[0]?.name).toBe("Bebidas no alcohólicas");
      expect(parsed.inventory[0]?.name).toBe("Base limón — ñoño");
      expect(parsed.inventory[0]?.updateStock).toBe(true);
    });

    it("reads unknown product tipo without validating it", async () => {
      const workbook = new ExcelJS.Workbook();
      addRequiredSheets(workbook);
      workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.products)!.addRow([
        "PROD-X",
        "Raro",
        "CAT-A",
        "desconocido",
        "",
        "",
        -100,
        "si",
      ]);

      const parsed = await codec.parse(await workbookToBytes(workbook));
      expect(parsed.products[0]?.fulfillmentType).toBe("desconocido");
      expect(parsed.products[0]?.pricePesos).toBe(-100);
    });
  });
});
