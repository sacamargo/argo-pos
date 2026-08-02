import { describe, expect, it } from "vitest";
import {
  cartTotal,
  initialPosState,
  posReducer,
} from "@/modules/pos/machine/pos-machine";

describe("posReducer", () => {
  it("adds a resolved variant to the cart", () => {
    const next = posReducer(initialPosState, {
      type: "VARIANT_RESOLVED",
      line: {
        variantId: "v1",
        label: "Granizado XL Chicle",
        unitPrice: 11000,
        quantity: 1,
      },
    });

    expect(next.step).toBe("inCart");
    expect(next.cart).toHaveLength(1);
    expect(cartTotal(next.cart)).toBe(11000);
  });

  it("increments quantity for the same variant", () => {
    const withLine = posReducer(initialPosState, {
      type: "VARIANT_RESOLVED",
      line: {
        variantId: "v1",
        label: "Granizado XL Chicle",
        unitPrice: 11000,
        quantity: 1,
      },
    });

    const next = posReducer(withLine, {
      type: "VARIANT_RESOLVED",
      line: {
        variantId: "v1",
        label: "Granizado XL Chicle",
        unitPrice: 11000,
        quantity: 1,
      },
    });

    expect(next.cart[0]?.quantity).toBe(2);
    expect(cartTotal(next.cart)).toBe(22000);
  });
});
