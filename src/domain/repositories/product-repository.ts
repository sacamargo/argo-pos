import type {
  Product,
  ProductFulfillmentType,
  ProductRecipeItem,
  ProductWithRecipe,
} from "@/domain/entities/product";

export type RecipeInput = {
  ingredientId: string;
  quantity: number;
};

export type CreateProductInput = {
  code: string;
  name: string;
  categoryId: string;
  imagePath?: string | null;
  priceCents: number;
  fulfillmentType: ProductFulfillmentType;
  stockItemId?: string | null;
  qtyPerSale?: number | null;
  recipe: RecipeInput[];
};

export type UpdateProductInput = {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  imagePath?: string | null;
  priceCents: number;
  fulfillmentType: ProductFulfillmentType;
  stockItemId?: string | null;
  qtyPerSale?: number | null;
  recipe: RecipeInput[];
};

export interface ProductRepository {
  listAll(): Promise<Product[]>;
  listActive(): Promise<Product[]>;
  findByIdWithRecipe(id: string): Promise<ProductWithRecipe | null>;
  findByCode(code: string): Promise<ProductWithRecipe | null>;
  create(input: CreateProductInput): Promise<ProductWithRecipe>;
  update(input: UpdateProductInput): Promise<ProductWithRecipe>;
  setActive(id: string, active: boolean): Promise<Product>;
  listRecipeByProductId(productId: string): Promise<ProductRecipeItem[]>;
}
