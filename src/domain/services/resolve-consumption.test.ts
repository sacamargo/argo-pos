import { describe, expect, it } from "vitest";
import type { ProductWithRecipe } from "@/domain/entities/product";
import {
  aggregateConsumption,
  resolveConsumption,
} from "@/domain/services/resolve-consumption";

const baseProduct = {
  id: "p1",
  code: "PROD-X",
  categoryId: "c1",
  name: "Demo",
  imagePath: null,
  priceCents: 1000,
  costCents: null,
  active: true,
  createdAt: "t",
  updatedAt: "t",
};

describe("resolveConsumption", () => {
  it("resolves simple product to one stock line", () => {
    const product: ProductWithRecipe = {
      ...baseProduct,
      fulfillmentType: "simple",
      stockItemId: "inv-agua",
      qtyPerSale: 1,
      recipe: [],
    };
    expect(resolveConsumption(product, 3)).toEqual([
      { ingredientId: "inv-agua", quantity: 3 },
    ]);
  });

  it("resolves compound product from recipe", () => {
    const product: ProductWithRecipe = {
      ...baseProduct,
      fulfillmentType: "compound",
      stockItemId: null,
      qtyPerSale: null,
      recipe: [
        { id: "r1", productId: "p1", ingredientId: "vaso", quantity: 1 },
        { id: "r2", productId: "p1", ingredientId: "mezcla", quantity: 250 },
      ],
    };
    expect(resolveConsumption(product, 2)).toEqual([
      { ingredientId: "vaso", quantity: 2 },
      { ingredientId: "mezcla", quantity: 500 },
    ]);
  });

  it("aggregates duplicate ingredient lines", () => {
    const lines = aggregateConsumption([
      { ingredientId: "a", quantity: 1 },
      { ingredientId: "a", quantity: 2 },
      { ingredientId: "b", quantity: 5 },
    ]);
    expect(lines).toEqual([
      { ingredientId: "a", quantity: 3 },
      { ingredientId: "b", quantity: 5 },
    ]);
  });

  it("rejects compound without recipe", () => {
    const product: ProductWithRecipe = {
      ...baseProduct,
      fulfillmentType: "compound",
      stockItemId: null,
      qtyPerSale: null,
      recipe: [],
    };
    expect(() => resolveConsumption(product, 1)).toThrow(/sin receta/i);
  });
});
