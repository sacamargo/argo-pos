export type CartLine = {
  productId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

export type Cart = {
  lines: CartLine[];
  discountCents: number;
};

export function emptyCart(): Cart {
  return { lines: [], discountCents: 0 };
}

export function addProduct(
  cart: Cart,
  product: { id: string; name: string; priceCents: number },
  quantity = 1,
): Cart {
  if (quantity <= 0) {
    return cart;
  }

  const existing = cart.lines.find((line) => line.productId === product.id);
  if (!existing) {
    return {
      ...cart,
      lines: [
        ...cart.lines,
        {
          productId: product.id,
          name: product.name,
          unitPriceCents: product.priceCents,
          quantity,
        },
      ],
    };
  }

  return {
    ...cart,
    lines: cart.lines.map((line) =>
      line.productId === product.id
        ? { ...line, quantity: line.quantity + quantity }
        : line,
    ),
  };
}

export function removeLine(cart: Cart, productId: string): Cart {
  return {
    ...cart,
    lines: cart.lines.filter((line) => line.productId !== productId),
  };
}

export function setQuantity(cart: Cart, productId: string, quantity: number): Cart {
  if (quantity <= 0) {
    return removeLine(cart, productId);
  }

  return {
    ...cart,
    lines: cart.lines.map((line) =>
      line.productId === productId ? { ...line, quantity } : line,
    ),
  };
}

export function setDiscount(cart: Cart, discountCents: number): Cart {
  return {
    ...cart,
    discountCents: Math.max(0, Math.floor(discountCents)),
  };
}

export function cartSubtotalCents(cart: Cart): number {
  return cart.lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0,
  );
}

export function cartTotalCents(cart: Cart): number {
  return Math.max(0, cartSubtotalCents(cart) - cart.discountCents);
}

export function lineTotalCents(line: CartLine): number {
  return line.unitPriceCents * line.quantity;
}

/** Returns change in cents, or throws if tendered is insufficient. */
export function calculateChangeCents(
  totalCents: number,
  amountTenderedCents: number,
): number {
  if (amountTenderedCents < totalCents) {
    throw new Error("El monto recibido es insuficiente");
  }
  return amountTenderedCents - totalCents;
}
