import type { ProductFulfillmentType } from "@/domain/entities/product";

export type RecipeDraft = {
  ingredientId: string;
  quantity: string;
};

export type ProductFormState = {
  id?: string;
  name: string;
  categoryId: string;
  imagePath: string;
  pricePesos: string;
  fulfillmentType: ProductFulfillmentType;
  stockItemId: string;
  qtyPerSale: string;
  recipe: RecipeDraft[];
};

export function emptyProductForm(categoryId = ""): ProductFormState {
  return {
    name: "",
    categoryId,
    imagePath: "",
    pricePesos: "",
    fulfillmentType: "compound",
    stockItemId: "",
    qtyPerSale: "1",
    recipe: [],
  };
}
