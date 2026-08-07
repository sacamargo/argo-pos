import { describe, expect, it } from "vitest";
import {
  adjustmentSchema,
  createIngredientSchema,
  purchaseInSchema,
} from "@/application/services/inventory-service";

describe("inventory schemas", () => {
  it("accepts a valid purchase entry", () => {
    const result = purchaseInSchema.safeParse({
      ingredientId: "ing-1",
      quantity: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects zero adjustment", () => {
    const result = adjustmentSchema.safeParse({
      ingredientId: "ing-1",
      quantity: 0,
      note: "sin cambio",
    });
    expect(result.success).toBe(false);
  });

  it("requires note for adjustment", () => {
    const result = adjustmentSchema.safeParse({
      ingredientId: "ing-1",
      quantity: -10,
      note: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts ingredient create payload", () => {
    const result = createIngredientSchema.safeParse({
      code: "INV-JARABE",
      name: "Jarabe",
      unit: "ml",
      minStock: 200,
      initialStock: 1000,
    });
    expect(result.success).toBe(true);
  });
});
