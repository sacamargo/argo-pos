import { describe, expect, it } from "vitest";
import type { CatalogWorkbookCodec } from "@/domain/catalog/catalog-workbook-codec";
import {
  CATALOG_WORKBOOK_SHEETS,
  type CatalogWorkbookDto,
} from "@/domain/catalog/catalog-workbook-dto";
import { ExcelJsCatalogWorkbookCodec } from "@/infrastructure/excel/exceljs-catalog-workbook-codec";

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

  it("stubs throw until template/export/parse branches", async () => {
    const codec = new ExcelJsCatalogWorkbookCodec();
    const empty: CatalogWorkbookDto = {
      categories: [],
      inventory: [],
      products: [],
      recipes: [],
    };

    await expect(codec.buildTemplate()).rejects.toThrow(/not implemented/i);
    await expect(codec.buildExport(empty)).rejects.toThrow(/not implemented/i);
    await expect(codec.parse(new Uint8Array())).rejects.toThrow(/not implemented/i);
  });
});
