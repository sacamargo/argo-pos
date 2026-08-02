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
  recipe: RecipeDraft[];
};

export function emptyProductForm(categoryId = ""): ProductFormState {
  return {
    name: "",
    categoryId,
    imagePath: "",
    pricePesos: "",
    recipe: [],
  };
}
