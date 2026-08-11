import { describe, expect, it, vi } from "vitest";
import { CatalogService } from "@/application/services/catalog-service";
import type { CatalogImportService } from "@/application/services/catalog-import-service";
import type { CategoryService } from "@/application/services/category-service";
import type { InventoryService } from "@/application/services/inventory-service";
import type { ProductService } from "@/application/services/product-service";
import type { CatalogWorkbookCodec } from "@/domain/catalog/catalog-workbook-codec";

describe("CatalogService", () => {
  it("aggregates categories, inventory and products with recipes", async () => {
    const categories = {
      listAll: vi.fn(async () => [
        { id: "c1", code: "CAT-A", name: "A", active: true, sortOrder: 1 },
      ]),
      findByCode: vi.fn(),
    } as unknown as CategoryService;

    const inventory = {
      listIngredients: vi.fn(async () => [
        {
          id: "i1",
          code: "INV-A",
          name: "Agua",
          unit: "und",
          stockQuantity: 10,
          minStock: 1,
          active: true,
          createdAt: "t",
        },
      ]),
      findByCode: vi.fn(),
    } as unknown as InventoryService;

    const products = {
      listAll: vi.fn(async () => [
        {
          id: "p1",
          code: "PROD-A",
          categoryId: "c1",
          name: "Agua",
          imagePath: null,
          priceCents: 1000,
          costCents: null,
          fulfillmentType: "simple" as const,
          stockItemId: "i1",
          qtyPerSale: 1,
          active: true,
          createdAt: "t",
          updatedAt: "t",
        },
      ]),
      getById: vi.fn(async () => ({
        id: "p1",
        code: "PROD-A",
        categoryId: "c1",
        name: "Agua",
        imagePath: null,
        priceCents: 1000,
        costCents: null,
        fulfillmentType: "simple" as const,
        stockItemId: "i1",
        qtyPerSale: 1,
        active: true,
        createdAt: "t",
        updatedAt: "t",
        recipe: [],
      })),
      findByCode: vi.fn(),
    } as unknown as ProductService;

    const workbook = {
      buildTemplate: vi.fn(),
      buildExport: vi.fn(),
      parse: vi.fn(),
    } as unknown as CatalogWorkbookCodec;

    const catalogImport = { import: vi.fn() } as unknown as CatalogImportService;
    const validator = { validate: vi.fn() };

    const catalog = new CatalogService(
      categories,
      inventory,
      products,
      workbook,
      catalogImport,
      validator,
    );
    const snapshot = await catalog.getCatalogSnapshot();

    expect(snapshot.categories).toHaveLength(1);
    expect(snapshot.inventory).toHaveLength(1);
    expect(snapshot.products).toHaveLength(1);
    expect(snapshot.products[0]?.code).toBe("PROD-A");
    expect(products.getById).toHaveBeenCalledWith("p1");
  });
});
