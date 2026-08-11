import { describe, expect, it } from "vitest";
import type { CatalogSnapshot } from "@/application/catalog/catalog-snapshot";
import { snapshotToWorkbookDto } from "@/application/catalog/snapshot-to-workbook-dto";

describe("snapshotToWorkbookDto", () => {
  it("maps codes and compound recipes without UUIDs", () => {
    const snapshot: CatalogSnapshot = {
      categories: [
        { id: "c1", code: "CAT-A", name: "Bebidas", active: true, sortOrder: 1 },
      ],
      inventory: [
        {
          id: "i1",
          code: "INV-A",
          name: "Base",
          unit: "ml",
          stockQuantity: 10,
          minStock: 1,
          active: true,
          createdAt: "t",
        },
      ],
      products: [
        {
          id: "p1",
          code: "PROD-S",
          categoryId: "c1",
          name: "Agua",
          imagePath: null,
          priceCents: 5000,
          costCents: null,
          fulfillmentType: "simple",
          stockItemId: "i1",
          qtyPerSale: 1,
          active: true,
          createdAt: "t",
          updatedAt: "t",
          recipe: [],
        },
        {
          id: "p2",
          code: "PROD-C",
          categoryId: "c1",
          name: "Granizado",
          imagePath: null,
          priceCents: 8000,
          costCents: null,
          fulfillmentType: "compound",
          stockItemId: null,
          qtyPerSale: null,
          active: true,
          createdAt: "t",
          updatedAt: "t",
          recipe: [
            { id: "r1", productId: "p2", ingredientId: "i1", quantity: 250 },
          ],
        },
      ],
    };

    const dto = snapshotToWorkbookDto(snapshot);
    expect(dto.categories[0]?.code).toBe("CAT-A");
    expect(dto.products[0]).toMatchObject({
      code: "PROD-S",
      categoryCode: "CAT-A",
      fulfillmentType: "simple",
      inventoryCode: "INV-A",
      pricePesos: 50,
      costPesos: null,
    });
    expect(dto.products[1]).toMatchObject({
      fulfillmentType: "compound",
      inventoryCode: null,
    });
    expect(dto.recipes).toEqual([
      { productCode: "PROD-C", inventoryCode: "INV-A", quantity: 250 },
    ]);
    expect(dto.inventory[0]?.updateStock).toBe(false);
  });
});
