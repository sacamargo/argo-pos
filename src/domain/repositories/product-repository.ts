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
  costCents?: number | null;
  fulfillmentType: ProductFulfillmentType;
  stockItemId?: string | null;
  qtyPerSale?: number | null;
  recipe: RecipeInput[];
};

export type UpdateProductInput = {
  id: string;
  name: string;
  categoryId: string;
  imagePath?: string | null;
  priceCents: number;
  costCents?: number | null;
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
  /** Maintenance wipe: removes every recipe row. */
  deleteAllRecipeItems(): Promise<number>;
  /** Removes recipe rows for one product. */
  deleteRecipeItemsByProductId(productId: string): Promise<number>;
  /** Maintenance wipe: hard-delete product row (caller ensures no blocking FKs). */
  deleteById(id: string): Promise<void>;
  /**
   * Catalog links that block deleting/hiding an inventory item.
   * asStock = simple product stockItemId; inRecipe = compound recipe line.
   */
  findActiveLinksToIngredient(ingredientId: string): Promise<{
    asStock: boolean;
    inRecipe: boolean;
  }>;
  /** Same as findActiveLinksToIngredient but includes inactive products. */
  findLinksToIngredient(ingredientId: string): Promise<{
    asStock: boolean;
    inRecipe: boolean;
  }>;
}
