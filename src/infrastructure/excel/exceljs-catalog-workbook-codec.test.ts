import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import type { CatalogWorkbookCodec } from "@/domain/catalog/catalog-workbook-codec";
import {
  CATALOG_WORKBOOK_SHEETS,
  type CatalogWorkbookDto,
} from "@/domain/catalog/catalog-workbook-dto";
import { CATALOG_WORKBOOK_HEADERS } from "@/infrastructure/excel/catalog-workbook-headers";
import { ExcelJsCatalogWorkbookCodec } from "@/infrastructure/excel/exceljs-catalog-workbook-codec";

async function loadTemplateWorkbook() {
  const codec = new ExcelJsCatalogWorkbookCodec();
  const bytes = await codec.buildTemplate();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(bytes));
  return { bytes, workbook };
}

function headerValues(sheet: ExcelJS.Worksheet): string[] {
  const row = sheet.getRow(1);
  const values: string[] = [];
  row.eachCell({ includeEmpty: false }, (cell, col) => {
    values[col - 1] = String(cell.value ?? "");
  });
  return values;
}

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
    expect(bytes[0]).toBe(0x50); // 'P' of PK zip signature
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

    const categories = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.categories);
    const inventory = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.inventory);
    const products = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.products);
    const recipes = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.recipes);
    const instructions = workbook.getWorksheet(CATALOG_WORKBOOK_SHEETS.instructions);

    expect(categories).toBeDefined();
    expect(inventory).toBeDefined();
    expect(products).toBeDefined();
    expect(recipes).toBeDefined();
    expect(instructions).toBeDefined();

    expect(headerValues(categories!)).toEqual([...CATALOG_WORKBOOK_HEADERS.categories]);
    expect(headerValues(inventory!)).toEqual([...CATALOG_WORKBOOK_HEADERS.inventory]);
    expect(headerValues(products!)).toEqual([...CATALOG_WORKBOOK_HEADERS.products]);
    expect(headerValues(recipes!)).toEqual([...CATALOG_WORKBOOK_HEADERS.recipes]);

    expect(String(categories!.getCell(2, 2).value)).toContain("Granizados");
    expect(String(inventory!.getCell(2, 2).value)).toContain("Base limón");
    expect(String(products!.getCell(2, 4).value)).toBe("simple");
    expect(String(products!.getCell(3, 4).value)).toBe("compound");
    expect(Number(recipes!.getCell(2, 3).value)).toBe(250);
    expect(String(instructions!.getCell(1, 1).value)).toMatch(/Argo POS/i);
  });

  it("keeps export and parse unimplemented", async () => {
    const codec = new ExcelJsCatalogWorkbookCodec();
    const empty: CatalogWorkbookDto = {
      categories: [],
      inventory: [],
      products: [],
      recipes: [],
    };

    await expect(codec.buildExport(empty)).rejects.toThrow(/not implemented/i);
    await expect(codec.parse(new Uint8Array())).rejects.toThrow(/not implemented/i);
  });
});
