import type {
  ConsumptionLine,
  ProductWithRecipe,
} from "@/domain/entities/product";

/**
 * Single inventory engine: every sellable product resolves to consumption lines.
 * simple → one stock item · compound → recipe BOM.
 */
export function resolveConsumption(
  product: ProductWithRecipe,
  saleQuantity: number,
): ConsumptionLine[] {
  if (!Number.isFinite(saleQuantity) || saleQuantity <= 0) {
    throw new Error("La cantidad de venta debe ser mayor a 0");
  }

  if (product.fulfillmentType === "simple") {
    if (!product.stockItemId) {
      throw new Error(`Producto simple sin inventario: ${product.name}`);
    }
    const qtyPerSale = product.qtyPerSale;
    if (qtyPerSale == null || qtyPerSale <= 0) {
      throw new Error(`Cantidad por venta inválida: ${product.name}`);
    }
    return [
      {
        ingredientId: product.stockItemId,
        quantity: qtyPerSale * saleQuantity,
      },
    ];
  }

  if (product.recipe.length === 0) {
    throw new Error(`Producto compound sin receta: ${product.name}`);
  }

  return product.recipe.map((item) => ({
    ingredientId: item.ingredientId,
    quantity: item.quantity * saleQuantity,
  }));
}

/** Merge consumption lines that share the same ingredient. */
export function aggregateConsumption(lines: ConsumptionLine[]): ConsumptionLine[] {
  const map = new Map<string, number>();
  for (const line of lines) {
    map.set(line.ingredientId, (map.get(line.ingredientId) ?? 0) + line.quantity);
  }
  return [...map.entries()].map(([ingredientId, quantity]) => ({
    ingredientId,
    quantity,
  }));
}
