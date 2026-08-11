import type { CatalogSnapshot } from "@/application/catalog/catalog-snapshot";
import type { CatalogWorkbookDto } from "@/domain/catalog/catalog-workbook-dto";
import { centsToPesos } from "@/shared/utils/money";

/** Maps domain snapshot → Excel workbook DTO (codes only, no UUIDs). */
export function snapshotToWorkbookDto(snapshot: CatalogSnapshot): CatalogWorkbookDto {
  const categoryCodeById = new Map(
    snapshot.categories.map((category) => [category.id, category.code]),
  );
  const inventoryCodeById = new Map(
    snapshot.inventory.map((item) => [item.id, item.code]),
  );

  return {
    categories: snapshot.categories.map((category) => ({
      code: category.code,
      name: category.name,
      active: category.active,
      sortOrder: category.sortOrder,
    })),
    inventory: snapshot.inventory.map((item) => ({
      code: item.code,
      name: item.name,
      unit: item.unit,
      minStock: item.minStock,
      stockQuantity: item.stockQuantity,
      active: item.active,
      updateStock: false,
    })),
    products: snapshot.products.map((product) => {
      const categoryCode = product.categoryId
        ? (categoryCodeById.get(product.categoryId) ?? "")
        : "";
      const isSimple = product.fulfillmentType === "simple";
      return {
        code: product.code,
        name: product.name,
        categoryCode,
        fulfillmentType: product.fulfillmentType,
        pricePesos: centsToPesos(product.priceCents),
        costPesos:
          product.costCents === null ? null : centsToPesos(product.costCents),
        active: product.active,
        inventoryCode:
          isSimple && product.stockItemId
            ? (inventoryCodeById.get(product.stockItemId) ?? null)
            : null,
        qtyPerSale: isSimple ? product.qtyPerSale : null,
      };
    }),
    recipes: snapshot.products.flatMap((product) => {
      if (product.fulfillmentType !== "compound") {
        return [];
      }
      return product.recipe.map((item) => ({
        productCode: product.code,
        inventoryCode: inventoryCodeById.get(item.ingredientId) ?? "",
        quantity: item.quantity,
      }));
    }),
  };
}
