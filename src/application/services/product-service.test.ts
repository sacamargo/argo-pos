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
      name: "Granizado",
      categoryId: "cat-1",
      priceCents: 0,
      recipe: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects recipe quantity <= 0", () => {
    const result = productWriteSchema.safeParse({
      name: "Granizado",
      categoryId: "cat-1",
      priceCents: 5000,
      recipe: [{ ingredientId: "ing-1", quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid product payload", () => {
    const result = productWriteSchema.safeParse({
      name: "Granizado limón",
      categoryId: "cat-1",
      priceCents: 5000,
      recipe: [{ ingredientId: "ing-1", quantity: 250 }],
    });
    expect(result.success).toBe(true);
  });
});
