import { describe, expect, it } from "vitest";
import type { CatalogWorkbookDto } from "@/domain/catalog/catalog-workbook-dto";
import { CatalogWorkbookValidator } from "@/infrastructure/excel/catalog-workbook-validator";

const emptyDto: CatalogWorkbookDto = {
  categories: [],
  inventory: [],
  products: [],
  recipes: [],
};

function validCatalog(): CatalogWorkbookDto {
  return {
    categories: [
      { code: "CAT-BEBIDAS", name: "Bebidas", active: true, sortOrder: 1 },
    ],
    inventory: [
      {
        code: "INV-VASO",
        name: "Vaso",
        unit: "und",
        stockQuantity: 10,
        minStock: 2,
        active: true,
        updateStock: false,
      },
      {
        code: "INV-BASE",
        name: "Base limón",
        unit: "ml",
        stockQuantity: 1000,
        minStock: 100,
        active: true,
        updateStock: false,
      },
    ],
    products: [
      {
        code: "PROD-AGUA",
        name: "Agua",
        categoryCode: "CAT-BEBIDAS",
        fulfillmentType: "simple",
        pricePesos: 2500,
        costPesos: null,
        active: true,
        inventoryCode: "INV-VASO",
        qtyPerSale: 1,
      },
      {
        code: "PROD-GRAN",
        name: "Granizado",
        categoryCode: "CAT-BEBIDAS",
        fulfillmentType: "compound",
        pricePesos: 8000,
        costPesos: null,
        active: true,
        inventoryCode: null,
        qtyPerSale: null,
      },
    ],
    recipes: [
      { productCode: "PROD-GRAN", inventoryCode: "INV-BASE", quantity: 250 },
      { productCode: "PROD-GRAN", inventoryCode: "INV-VASO", quantity: 1 },
    ],
  };
}

describe("CatalogWorkbookValidator", () => {
  const validator = new CatalogWorkbookValidator();

  it("accepts a valid workbook dto", () => {
    const report = validator.validate(validCatalog());
    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.summary).toEqual({
      categories: 1,
      inventory: 2,
      products: 2,
      recipes: 2,
    });
  });

  it("accepts an empty workbook", () => {
    const report = validator.validate(emptyDto);
    expect(report.valid).toBe(true);
    expect(report.summary.products).toBe(0);
  });

  it("reports missing category reference", () => {
    const dto = validCatalog();
    dto.products[0]!.categoryCode = "CAT-FANTASMA";
    const report = validator.validate(dto);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.code === "PRODUCT_CATEGORY_MISSING")).toBe(
      true,
    );
  });

  it("reports missing inventory reference on simple product", () => {
    const dto = validCatalog();
    dto.products[0]!.inventoryCode = "INV-FANTASMA";
    const report = validator.validate(dto);
    expect(report.errors.some((e) => e.code === "PRODUCT_INVENTORY_MISSING")).toBe(
      true,
    );
  });

  it("reports missing product reference on recipe", () => {
    const dto = validCatalog();
    dto.recipes[0]!.productCode = "PROD-FANTASMA";
    const report = validator.validate(dto);
    expect(report.errors.some((e) => e.code === "RECIPE_PRODUCT_MISSING")).toBe(
      true,
    );
  });

  it("reports missing inventory reference on recipe", () => {
    const dto = validCatalog();
    dto.recipes[0]!.inventoryCode = "INV-FANTASMA";
    const report = validator.validate(dto);
    expect(report.errors.some((e) => e.code === "RECIPE_INVENTORY_MISSING")).toBe(
      true,
    );
  });

  it("reports duplicate recipe lines", () => {
    const dto = validCatalog();
    dto.recipes.push({
      productCode: "PROD-GRAN",
      inventoryCode: "INV-BASE",
      quantity: 10,
    });
    const report = validator.validate(dto);
    expect(report.errors.some((e) => e.code === "RECIPE_DUPLICATE")).toBe(true);
  });

  it("reports simple product without inventory", () => {
    const dto = validCatalog();
    dto.products[0]!.inventoryCode = null;
    const report = validator.validate(dto);
    expect(
      report.errors.some((e) => e.code === "PRODUCT_SIMPLE_INVENTORY_REQUIRED"),
    ).toBe(true);
  });

  it("reports simple product with qty <= 0", () => {
    const dto = validCatalog();
    dto.products[0]!.qtyPerSale = 0;
    const report = validator.validate(dto);
    expect(report.errors.some((e) => e.code === "PRODUCT_SIMPLE_QTY_INVALID")).toBe(
      true,
    );
  });

  it("reports compound product with inventory link", () => {
    const dto = validCatalog();
    dto.products[1]!.inventoryCode = "INV-VASO";
    dto.products[1]!.qtyPerSale = 1;
    const report = validator.validate(dto);
    expect(
      report.errors.some((e) => e.code === "PRODUCT_COMPOUND_INVENTORY_FORBIDDEN"),
    ).toBe(true);
    expect(
      report.errors.some((e) => e.code === "PRODUCT_COMPOUND_QTY_FORBIDDEN"),
    ).toBe(true);
  });

  it("reports duplicate codes", () => {
    const dto = validCatalog();
    dto.categories.push({
      code: "cat-bebidas",
      name: "Otra",
      active: true,
      sortOrder: 2,
    });
    dto.inventory.push({
      code: "INV-VASO",
      name: "Dup",
      unit: "und",
      stockQuantity: 1,
      minStock: 0,
      active: true,
      updateStock: false,
    });
    dto.products.push({
      code: "PROD-AGUA",
      name: "Dup",
      categoryCode: "CAT-BEBIDAS",
      fulfillmentType: "simple",
      pricePesos: 100,
      costPesos: null,
      active: true,
      inventoryCode: "INV-VASO",
      qtyPerSale: 1,
    });
    const report = validator.validate(dto);
    expect(report.errors.some((e) => e.code === "CATEGORY_CODE_DUPLICATE")).toBe(
      true,
    );
    expect(report.errors.some((e) => e.code === "INVENTORY_CODE_DUPLICATE")).toBe(
      true,
    );
    expect(report.errors.some((e) => e.code === "PRODUCT_CODE_DUPLICATE")).toBe(
      true,
    );
  });

  it("reports negative price", () => {
    const dto = validCatalog();
    dto.products[0]!.pricePesos = -1;
    const report = validator.validate(dto);
    expect(report.errors.some((e) => e.code === "PRODUCT_PRICE_INVALID")).toBe(
      true,
    );
  });

  it("reports negative stock", () => {
    const dto = validCatalog();
    dto.inventory[0]!.stockQuantity = -5;
    const report = validator.validate(dto);
    expect(report.errors.some((e) => e.code === "INVENTORY_STOCK_INVALID")).toBe(
      true,
    );
  });

  it("reports empty unit", () => {
    const dto = validCatalog();
    dto.inventory[0]!.unit = "  ";
    const report = validator.validate(dto);
    expect(report.errors.some((e) => e.code === "INVENTORY_UNIT_REQUIRED")).toBe(
      true,
    );
  });

  it("reports invalid product type", () => {
    const dto = validCatalog();
    dto.products[0]!.fulfillmentType = "desconocido" as "simple";
    const report = validator.validate(dto);
    expect(report.errors.some((e) => e.code === "PRODUCT_TYPE_INVALID")).toBe(
      true,
    );
  });

  it("accumulates multiple errors without stopping early", () => {
    const dto: CatalogWorkbookDto = {
      categories: [{ code: "", name: "", active: true, sortOrder: 0 }],
      inventory: [
        {
          code: "",
          name: "",
          unit: "",
          stockQuantity: -1,
          minStock: -2,
          active: true,
          updateStock: false,
        },
      ],
      products: [
        {
          code: "",
          name: "",
          categoryCode: "CAT-X",
          fulfillmentType: "simple",
          pricePesos: -10,
          costPesos: null,
          active: true,
          inventoryCode: null,
          qtyPerSale: 0,
        },
      ],
      recipes: [
        { productCode: "P1", inventoryCode: "I1", quantity: 0 },
      ],
    };

    const report = validator.validate(dto);
    expect(report.valid).toBe(false);
    expect(report.errors.length).toBeGreaterThanOrEqual(10);
  });

  it("rejects negative cost", () => {
    const dto = validCatalog();
    dto.products[0]!.costPesos = -5;
    const report = validator.validate(dto);
    expect(report.valid).toBe(false);
    expect(report.errors.some((e) => e.code === "PRODUCT_COST_INVALID")).toBe(true);
  });

  it("accepts empty cost", () => {
    const dto = validCatalog();
    dto.products[0]!.costPesos = null;
    dto.products[1]!.costPesos = 0;
    const report = validator.validate(dto);
    expect(report.valid).toBe(true);
  });
});
