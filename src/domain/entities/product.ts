export type ProductRecipeItem = {
  id: string;
  productId: string;
  ingredientId: string;
  quantity: number;
};

export type Product = {
  id: string;
  categoryId: string | null;
  name: string;
  imagePath: string | null;
  priceCents: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProductWithRecipe = Product & {
  recipe: ProductRecipeItem[];
};
