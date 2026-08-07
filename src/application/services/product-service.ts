import { z } from "zod";
import type { CategoryRepository } from "@/domain/repositories/category-repository";
import type { IngredientRepository } from "@/domain/repositories/ingredient-repository";
import type { ProductRepository } from "@/domain/repositories/product-repository";
import type { Product, ProductWithRecipe } from "@/domain/entities/product";
import type { Ingredient } from "@/domain/entities/ingredient";
import {
  businessCodeSchema,
  normalizeBusinessCode,
} from "@/shared/utils/business-code";

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1, "Ingrediente obligatorio"),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
});

const productBaseSchema = z.object({
  code: businessCodeSchema,
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  categoryId: z.string().min(1, "La categoría es obligatoria"),
  imagePath: z.string().trim().nullable().optional(),
  priceCents: z.number().int().positive("El precio debe ser mayor a 0"),
});

export const productWriteSchema = z.discriminatedUnion("fulfillmentType", [
  productBaseSchema.extend({
    fulfillmentType: z.literal("simple"),
    stockItemId: z.string().min(1, "El inventario es obligatorio"),
    qtyPerSale: z.number().positive("La cantidad por venta debe ser mayor a 0"),
    recipe: z.array(recipeItemSchema).max(0).optional().default([]),
  }),
  productBaseSchema.extend({
    fulfillmentType: z.literal("compound"),
    stockItemId: z.null().optional(),
    qtyPerSale: z.null().optional(),
    recipe: z.array(recipeItemSchema).min(1, "La receta necesita al menos un ítem"),
  }),
]);

export const updateProductSchema = z.discriminatedUnion("fulfillmentType", [
  productBaseSchema.extend({
    id: z.string().min(1),
    fulfillmentType: z.literal("simple"),
    stockItemId: z.string().min(1, "El inventario es obligatorio"),
    qtyPerSale: z.number().positive("La cantidad por venta debe ser mayor a 0"),
    recipe: z.array(recipeItemSchema).max(0).optional().default([]),
  }),
  productBaseSchema.extend({
    id: z.string().min(1),
    fulfillmentType: z.literal("compound"),
    stockItemId: z.null().optional(),
    qtyPerSale: z.null().optional(),
    recipe: z.array(recipeItemSchema).min(1, "La receta necesita al menos un ítem"),
  }),
]);

export const setProductActiveSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export class ProductService {
  constructor(
    private readonly products: ProductRepository,
    private readonly categories: CategoryRepository,
    private readonly ingredients: IngredientRepository,
  ) {}

  async listAll(): Promise<Product[]> {
    return this.products.listAll();
  }

  async listActive(): Promise<Product[]> {
    return this.products.listActive();
  }

  async getById(id: string): Promise<ProductWithRecipe | null> {
    return this.products.findByIdWithRecipe(id);
  }

  async findByCode(code: string): Promise<ProductWithRecipe | null> {
    return this.products.findByCode(code);
  }

  async listActiveIngredients(): Promise<Ingredient[]> {
    return this.ingredients.listActive();
  }

  private async assertUniqueCode(code: string, excludeId?: string) {
    const existing = await this.products.findByCode(code);
    if (existing && existing.id !== excludeId) {
      throw new Error(`Ya existe un producto con código ${normalizeBusinessCode(code)}`);
    }
  }

  private async assertWritable(
    input: z.infer<typeof productWriteSchema> | z.infer<typeof updateProductSchema>,
  ) {
    const category = await this.categories.findById(input.categoryId);
    if (!category || !category.active) {
      throw new Error("La categoría no existe o está inactiva");
    }

    if (input.fulfillmentType === "simple") {
      const stockItem = await this.ingredients.findById(input.stockItemId);
      if (!stockItem || !stockItem.active) {
        throw new Error("El ítem de inventario no existe o está inactivo");
      }
      return;
    }

    const seen = new Set<string>();
    for (const item of input.recipe) {
      if (seen.has(item.ingredientId)) {
        throw new Error("La receta no puede repetir el mismo ítem de inventario");
      }
      seen.add(item.ingredientId);

      const ingredient = await this.ingredients.findById(item.ingredientId);
      if (!ingredient || !ingredient.active) {
        throw new Error("Hay un ítem de inventario inválido o inactivo en la receta");
      }
    }
  }

  async create(raw: unknown): Promise<ProductWithRecipe> {
    const input = productWriteSchema.parse(raw);
    await this.assertUniqueCode(input.code);
    await this.assertWritable(input);
    return this.products.create({
      ...input,
      imagePath: input.imagePath?.trim() ? input.imagePath.trim() : null,
      recipe: input.fulfillmentType === "compound" ? input.recipe : [],
      stockItemId: input.fulfillmentType === "simple" ? input.stockItemId : null,
      qtyPerSale: input.fulfillmentType === "simple" ? input.qtyPerSale : null,
    });
  }

  async update(raw: unknown): Promise<ProductWithRecipe> {
    const input = updateProductSchema.parse(raw);
    const existing = await this.products.findByIdWithRecipe(input.id);
    if (!existing) {
      throw new Error("Producto no encontrado");
    }
    await this.assertUniqueCode(input.code, input.id);
    await this.assertWritable(input);
    return this.products.update({
      ...input,
      imagePath: input.imagePath?.trim() ? input.imagePath.trim() : null,
      recipe: input.fulfillmentType === "compound" ? input.recipe : [],
      stockItemId: input.fulfillmentType === "simple" ? input.stockItemId : null,
      qtyPerSale: input.fulfillmentType === "simple" ? input.qtyPerSale : null,
    });
  }

  async setActive(raw: unknown): Promise<Product> {
    const input = setProductActiveSchema.parse(raw);
    const existing = await this.products.findByIdWithRecipe(input.id);
    if (!existing) {
      throw new Error("Producto no encontrado");
    }
    return this.products.setActive(input.id, input.active);
  }
}
