export type ProductFulfillmentType = "simple" | "compound";

export type ProductRecipeItem = {
  id: string;
  productId: string;
  ingredientId: string;
  quantity: number;
};

export type Product = {
  id: string;
  code: string;
  categoryId: string | null;
  name: string;
  imagePath: string | null;
  priceCents: number;
  fulfillmentType: ProductFulfillmentType;
  stockItemId: string | null;
  qtyPerSale: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductWithRecipe = Product & {
  recipe: ProductRecipeItem[];
};

/** One inventory consumption line after resolving a sale quantity. */
export type ConsumptionLine = {
  ingredientId: string;
  quantity: number;
};
