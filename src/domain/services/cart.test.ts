import { describe, expect, it } from "vitest";
import {
  addProduct,
  calculateChangeCents,
  cartSubtotalCents,
  cartTotalCents,
  emptyCart,
  removeLine,
  setDiscount,
  setQuantity,
} from "@/domain/services/cart";

const limon = { id: "p1", name: "Granizado limón", priceCents: 5000 };
const mora = { id: "p2", name: "Granizado mora", priceCents: 6000 };

describe("cart domain", () => {
  it("adds products and merges quantities", () => {
    let cart = emptyCart();
    cart = addProduct(cart, limon);
    cart = addProduct(cart, limon, 2);
    cart = addProduct(cart, mora);

    expect(cart.lines).toHaveLength(2);
    expect(cart.lines[0]?.quantity).toBe(3);
    expect(cartSubtotalCents(cart)).toBe(15_000 + 6_000);
  });

  it("removes and updates quantity", () => {
    let cart = addProduct(emptyCart(), limon, 2);
    cart = setQuantity(cart, limon.id, 1);
    expect(cart.lines[0]?.quantity).toBe(1);
    cart = setQuantity(cart, limon.id, 0);
    expect(cart.lines).toHaveLength(0);
    cart = addProduct(emptyCart(), limon);
    cart = removeLine(cart, limon.id);
    expect(cart.lines).toHaveLength(0);
  });

  it("applies discount without going negative", () => {
    let cart = addProduct(emptyCart(), limon, 2);
    cart = setDiscount(cart, 3_000);
    expect(cartTotalCents(cart)).toBe(7_000);
    cart = setDiscount(cart, 99_999);
    expect(cartTotalCents(cart)).toBe(0);
  });

  it("calculates change and rejects insufficient tender", () => {
    expect(calculateChangeCents(10_000, 20_000)).toBe(10_000);
    expect(() => calculateChangeCents(10_000, 9_999)).toThrow(/insuficiente/);
  });
});
