import { describe, expect, it } from "vitest";
import { createSaleSchema } from "@/application/services/sale-service";

describe("createSale schema", () => {
  it("accepts a valid cash sale payload", () => {
    const result = createSaleSchema.safeParse({
      userId: "u1",
      paymentMethodId: "pm1",
      cart: {
        lines: [
          {
            productId: "p1",
            name: "Granizado",
            unitPriceCents: 5000,
            quantity: 2,
          },
        ],
        discountCents: 0,
      },
      amountTenderedCents: 20_000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty cart", () => {
    const result = createSaleSchema.safeParse({
      userId: "u1",
      paymentMethodId: "pm1",
      cart: { lines: [], discountCents: 0 },
    });
    expect(result.success).toBe(false);
  });
});
