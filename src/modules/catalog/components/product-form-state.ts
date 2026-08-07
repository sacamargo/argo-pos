import type { ProductFulfillmentType } from "@/domain/entities/product";
import { DEFAULT_INVENTORY_UNIT } from "@/modules/inventory/constants/units";

export type RecipeDraft = {
  ingredientId: string;
  quantity: string;
};

export type InventoryLinkMode = "new" | "existing";

export type ProductFormState = {
  id?: string;
  name: string;
  categoryId: string;
  imagePath: string;
  pricePesos: string;
  fulfillmentType: ProductFulfillmentType;
  inventoryLinkMode: InventoryLinkMode;
  stockItemId: string;
  qtyPerSale: string;
  newInventoryUnit: string;
  newInventoryMin: string;
  newInventoryInitial: string;
  recipe: RecipeDraft[];
};

export function emptyProductForm(categoryId = ""): ProductFormState {
  return {
    name: "",
    categoryId,
    imagePath: "",
    pricePesos: "",
    fulfillmentType: "simple",
    inventoryLinkMode: "new",
    stockItemId: "",
    qtyPerSale: "1",
    newInventoryUnit: DEFAULT_INVENTORY_UNIT,
    newInventoryMin: "0",
    newInventoryInitial: "0",
    recipe: [],
  };
}
