import { describe, expect, it } from "vitest";
import { productWriteSchema } from "@/application/services/product-service";
import { centsToPesos, pesosToCents } from "@/shared/utils/money";

describe("money helpers", () => {
  it("converts pesos and cents without float drift for COP integers", () => {
    expect(pesosToCents(50)).toBe(5000);
    expect(centsToPesos(5000)).toBe(50);
  });
});

describe("productWriteSchema", () => {
  it("rejects non-positive price", () => {
    const result = productWriteSchema.safeParse({
      code: "PROD-X",
      name: "Granizado",
      categoryId: "cat-1",
      fulfillmentType: "compound",
      priceCents: 0,
      costCents: null,
      recipe: [{ ingredientId: "ing-1", quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects recipe quantity <= 0 for compound", () => {
    const result = productWriteSchema.safeParse({
      code: "PROD-X",
      name: "Granizado",
      categoryId: "cat-1",
      fulfillmentType: "compound",
      priceCents: 5000,
      costCents: null,
      recipe: [{ ingredientId: "ing-1", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid compound product", () => {
    const result = productWriteSchema.safeParse({
      name: "Granizado limón",
      categoryId: "cat-1",
      fulfillmentType: "compound",
      priceCents: 5000,
      costCents: null,
      recipe: [{ ingredientId: "ing-1", quantity: 250 }],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid simple product", () => {
    const result = productWriteSchema.safeParse({
      name: "Agua 600ml",
      categoryId: "cat-1",
      fulfillmentType: "simple",
      priceCents: 2000,
      costCents: null,
      stockItemId: "inv-agua",
      qtyPerSale: 1,
      recipe: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts optional provided code for Excel path", () => {
    const result = productWriteSchema.safeParse({
      code: "PROD-EXCEL",
      name: "Desde Excel",
      categoryId: "cat-1",
      fulfillmentType: "compound",
      priceCents: 5000,
      costCents: null,
      recipe: [{ ingredientId: "ing-1", quantity: 1 }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects simple without stock item or createInventory", () => {
    const result = productWriteSchema.safeParse({
      code: "PROD-AGUA",
      name: "Agua",
      categoryId: "cat-1",
      fulfillmentType: "simple",
      priceCents: 2000,
      costCents: null,
      qtyPerSale: 1,
      recipe: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts simple with createInventory in one shot", () => {
    const result = productWriteSchema.safeParse({
      name: "Doritos",
      categoryId: "cat-1",
      fulfillmentType: "simple",
      priceCents: 3500,
      costCents: null,
      qtyPerSale: 1,
      createInventory: { unit: "und", minStock: 12, initialStock: 48 },
      recipe: [],
    });
    expect(result.success).toBe(true);
  });

  it("rejects simple with both stockItemId and createInventory", () => {
    const result = productWriteSchema.safeParse({
      name: "Doritos",
      categoryId: "cat-1",
      fulfillmentType: "simple",
      priceCents: 3500,
      costCents: null,
      qtyPerSale: 1,
      stockItemId: "inv-1",
      createInventory: { unit: "und", minStock: 0 },
      recipe: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional cost zero and positive", () => {
    const zero = productWriteSchema.safeParse({
      name: "Agua",
      categoryId: "cat-1",
      fulfillmentType: "simple",
      priceCents: 2000,
      costCents: 0,
      stockItemId: "inv-agua",
      qtyPerSale: 1,
      recipe: [],
    });
    expect(zero.success).toBe(true);

    const withCost = productWriteSchema.safeParse({
      name: "Agua",
      categoryId: "cat-1",
      fulfillmentType: "simple",
      priceCents: 10_000,
      costCents: 6_000,
      stockItemId: "inv-agua",
      qtyPerSale: 1,
      recipe: [],
    });
    expect(withCost.success).toBe(true);
  });

  it("rejects negative cost", () => {
    const result = productWriteSchema.safeParse({
      name: "Agua",
      categoryId: "cat-1",
      fulfillmentType: "simple",
      priceCents: 2000,
      costCents: -1,
      stockItemId: "inv-agua",
      qtyPerSale: 1,
      recipe: [],
    });
    expect(result.success).toBe(false);
  });

  it("accepts product without cost field", () => {
    const result = productWriteSchema.safeParse({
      name: "Agua",
      categoryId: "cat-1",
      fulfillmentType: "simple",
      priceCents: 2000,
      stockItemId: "inv-agua",
      qtyPerSale: 1,
      recipe: [],
    });
    expect(result.success).toBe(true);
  });
});
