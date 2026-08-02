import { asc, eq } from "drizzle-orm";
import type {
  Product,
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

function mapProduct(row: {
  id: string;
  categoryId: string | null;
  name: string;
  imagePath: string | null;
  priceCents: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}): Product {
  return {
    id: row.id,
    categoryId: row.categoryId,
    name: row.name,
    imagePath: row.imagePath,
    priceCents: row.priceCents,
    active: row.active,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleProductRepository implements ProductRepository {
  constructor(private readonly db: AppDatabase) {}

  async listAll(): Promise<Product[]> {
    const rows = await this.db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        imagePath: products.imagePath,
        priceCents: products.priceCents,
        active: products.active,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .orderBy(asc(products.name));

    return rows.map(mapProduct);
  }

  async listActive(): Promise<Product[]> {
    const rows = await this.db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        imagePath: products.imagePath,
        priceCents: products.priceCents,
        active: products.active,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
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
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        imagePath: products.imagePath,
        priceCents: products.priceCents,
        active: products.active,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    const recipe = await this.listRecipeByProductId(id);
    return { ...mapProduct(row), recipe };
  }

  async create(input: CreateProductInput): Promise<ProductWithRecipe> {
    const now = new Date().toISOString();
    const product: Product = {
      id: crypto.randomUUID(),
      categoryId: input.categoryId,
      name: input.name,
      imagePath: input.imagePath ?? null,
      priceCents: input.priceCents,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    await this.db.insert(products).values(product);

    const recipe: ProductRecipeItem[] = input.recipe.map((item) => ({
      id: crypto.randomUUID(),
      productId: product.id,
      ingredientId: item.ingredientId,
      quantity: item.quantity,
    }));

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
        updatedAt: now,
      })
      .where(eq(products.id, input.id));

    await this.db
      .delete(productRecipeItems)
      .where(eq(productRecipeItems.productId, input.id));

    const recipe: ProductRecipeItem[] = input.recipe.map((item) => ({
      id: crypto.randomUUID(),
      productId: input.id,
      ingredientId: item.ingredientId,
      quantity: item.quantity,
    }));

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
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        imagePath: products.imagePath,
        priceCents: products.priceCents,
        active: products.active,
        createdAt: products.createdAt,
        updatedAt: products.updatedAt,
      })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!row) {
      throw new Error("Producto no encontrado tras cambiar estado");
    }

    return mapProduct(row);
  }
}
