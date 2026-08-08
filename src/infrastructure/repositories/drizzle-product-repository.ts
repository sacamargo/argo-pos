import { and, asc, eq } from "drizzle-orm";
import type {
  Product,
  ProductFulfillmentType,
  ProductRecipeItem,
  ProductWithRecipe,
} from "@/domain/entities/product";
import type {
  CreateProductInput,
  ProductRepository,
  UpdateProductInput,
} from "@/domain/repositories/product-repository";
import { productRecipeItems, products } from "@/database/schema";
import type { AppDatabase } from "@/infrastructure/sqlite/client";
import { normalizeBusinessCode } from "@/shared/utils/business-code";

function mapProduct(row: {
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
}): Product {
  return {
    id: row.id,
    code: row.code,
    categoryId: row.categoryId,
    name: row.name,
    imagePath: row.imagePath,
    priceCents: row.priceCents,
    fulfillmentType: row.fulfillmentType,
    stockItemId: row.stockItemId,
    qtyPerSale: row.qtyPerSale,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const selectFields = {
  id: products.id,
  code: products.code,
  categoryId: products.categoryId,
  name: products.name,
  imagePath: products.imagePath,
  priceCents: products.priceCents,
  fulfillmentType: products.fulfillmentType,
  stockItemId: products.stockItemId,
  qtyPerSale: products.qtyPerSale,
  active: products.active,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
};

export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly db: AppDatabase) {}

  async listAll(): Promise<Product[]> {
    const rows = await this.db
      .select(selectFields)
      .from(products)
      .orderBy(asc(products.name));
    return rows.map(mapProduct);
  }

  async listActive(): Promise<Product[]> {
    const rows = await this.db
      .select(selectFields)
      .from(products)
      .where(eq(products.active, true))
      .orderBy(asc(products.name));
    return rows.map(mapProduct);
  }

  async listRecipeByProductId(productId: string): Promise<ProductRecipeItem[]> {
    const rows = await this.db
      .select({
        id: productRecipeItems.id,
        productId: productRecipeItems.productId,
        ingredientId: productRecipeItems.ingredientId,
        quantity: productRecipeItems.quantity,
      })
      .from(productRecipeItems)
      .where(eq(productRecipeItems.productId, productId));

    return rows.map((row) => ({
      id: row.id,
      productId: row.productId,
      ingredientId: row.ingredientId,
      quantity: row.quantity,
    }));
  }

  async findByIdWithRecipe(id: string): Promise<ProductWithRecipe | null> {
    const [row] = await this.db
      .select(selectFields)
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    const recipe = await this.listRecipeByProductId(id);
    return { ...mapProduct(row), recipe };
  }

  async findByCode(code: string): Promise<ProductWithRecipe | null> {
    const [row] = await this.db
      .select(selectFields)
      .from(products)
      .where(eq(products.code, normalizeBusinessCode(code)))
      .limit(1);

    if (!row) {
      return null;
    }

    const recipe = await this.listRecipeByProductId(row.id);
    return { ...mapProduct(row), recipe };
  }

  async create(input: CreateProductInput): Promise<ProductWithRecipe> {
    const now = new Date().toISOString();
    const product: Product = {
      id: crypto.randomUUID(),
      code: normalizeBusinessCode(input.code),
      categoryId: input.categoryId,
      name: input.name,
      imagePath: input.imagePath ?? null,
      priceCents: input.priceCents,
      fulfillmentType: input.fulfillmentType,
      stockItemId:
        input.fulfillmentType === "simple" ? (input.stockItemId ?? null) : null,
      qtyPerSale: input.fulfillmentType === "simple" ? (input.qtyPerSale ?? 1) : null,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(products).values(product);

    const recipe: ProductRecipeItem[] =
      input.fulfillmentType === "compound"
        ? input.recipe.map((item) => ({
            id: crypto.randomUUID(),
            productId: product.id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
          }))
        : [];

    if (recipe.length > 0) {
      await this.db.insert(productRecipeItems).values(recipe);
    }

    return { ...product, recipe };
  }

  async update(input: UpdateProductInput): Promise<ProductWithRecipe> {
    const now = new Date().toISOString();

    await this.db
      .update(products)
      .set({
        name: input.name,
        categoryId: input.categoryId,
        imagePath: input.imagePath ?? null,
        priceCents: input.priceCents,
        fulfillmentType: input.fulfillmentType,
        stockItemId:
          input.fulfillmentType === "simple" ? (input.stockItemId ?? null) : null,
        qtyPerSale: input.fulfillmentType === "simple" ? (input.qtyPerSale ?? 1) : null,
        updatedAt: now,
      })
      .where(eq(products.id, input.id));

    await this.db
      .delete(productRecipeItems)
      .where(eq(productRecipeItems.productId, input.id));

    const recipe: ProductRecipeItem[] =
      input.fulfillmentType === "compound"
        ? input.recipe.map((item) => ({
            id: crypto.randomUUID(),
            productId: input.id,
            ingredientId: item.ingredientId,
            quantity: item.quantity,
          }))
        : [];

    if (recipe.length > 0) {
      await this.db.insert(productRecipeItems).values(recipe);
    }

    const updated = await this.findByIdWithRecipe(input.id);
    if (!updated) {
      throw new Error("Producto no encontrado tras actualizar");
    }
    return updated;
  }

  async setActive(id: string, active: boolean): Promise<Product> {
    const now = new Date().toISOString();
    await this.db
      .update(products)
      .set({ active, updatedAt: now })
      .where(eq(products.id, id));

    const [row] = await this.db
      .select(selectFields)
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!row) {
      throw new Error("Producto no encontrado tras cambiar estado");
    }

    return mapProduct(row);
  }

  async deleteAllRecipeItems(): Promise<number> {
    const existing = await this.db.select({ id: productRecipeItems.id }).from(productRecipeItems);
    if (existing.length === 0) {
      return 0;
    }
    await this.db.delete(productRecipeItems);
    return existing.length;
  }

  async deleteRecipeItemsByProductId(productId: string): Promise<number> {
    const existing = await this.db
      .select({ id: productRecipeItems.id })
      .from(productRecipeItems)
      .where(eq(productRecipeItems.productId, productId));
    if (existing.length === 0) {
      return 0;
    }
    await this.db
      .delete(productRecipeItems)
      .where(eq(productRecipeItems.productId, productId));
    return existing.length;
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  async findActiveLinksToIngredient(ingredientId: string): Promise<{
    asStock: boolean;
    inRecipe: boolean;
  }> {
    return this.findLinksToIngredientInternal(ingredientId, true);
  }

  async findLinksToIngredient(ingredientId: string): Promise<{
    asStock: boolean;
    inRecipe: boolean;
  }> {
    return this.findLinksToIngredientInternal(ingredientId, false);
  }

  private async findLinksToIngredientInternal(
    ingredientId: string,
    activeOnly: boolean,
  ): Promise<{ asStock: boolean; inRecipe: boolean }> {
    const stockWhere = activeOnly
      ? and(eq(products.active, true), eq(products.stockItemId, ingredientId))
      : eq(products.stockItemId, ingredientId);

    const [asStockRow] = await this.db
      .select({ id: products.id })
      .from(products)
      .where(stockWhere)
      .limit(1);

    const recipeWhere = activeOnly
      ? and(eq(products.active, true), eq(productRecipeItems.ingredientId, ingredientId))
      : eq(productRecipeItems.ingredientId, ingredientId);

    const [recipeRow] = await this.db
      .select({ id: productRecipeItems.id })
      .from(productRecipeItems)
      .innerJoin(products, eq(productRecipeItems.productId, products.id))
      .where(recipeWhere)
      .limit(1);

    return {
      asStock: Boolean(asStockRow),
      inRecipe: Boolean(recipeRow),
    };
  }
}
