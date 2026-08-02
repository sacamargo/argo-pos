import { z } from "zod";
import type { CategoryRepository } from "@/domain/repositories/category-repository";
import type { IngredientRepository } from "@/domain/repositories/ingredient-repository";
import type { ProductRepository } from "@/domain/repositories/product-repository";
import type { Product, ProductWithRecipe } from "@/domain/entities/product";
import type { Ingredient } from "@/domain/entities/ingredient";

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1, "Ingrediente obligatorio"),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
});

export const productWriteSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  categoryId: z.string().min(1, "La categoría es obligatoria"),
  imagePath: z.string().trim().nullable().optional(),
  priceCents: z.number().int().positive("El precio debe ser mayor a 0"),
  recipe: z.array(recipeItemSchema),
});

export const updateProductSchema = productWriteSchema.extend({
  id: z.string().min(1),
});

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

  async listActiveIngredients(): Promise<Ingredient[]> {
    return this.ingredients.listActive();
  }

  private async assertWritable(input: z.infer<typeof productWriteSchema>) {
    const category = await this.categories.findById(input.categoryId);
    if (!category || !category.active) {
      throw new Error("La categoría no existe o está inactiva");
    }

    const seen = new Set<string>();
    for (const item of input.recipe) {
      if (seen.has(item.ingredientId)) {
        throw new Error("La receta no puede repetir el mismo ingrediente");
      }
      seen.add(item.ingredientId);

      const ingredient = await this.ingredients.findById(item.ingredientId);
      if (!ingredient || !ingredient.active) {
        throw new Error("Hay un ingrediente inválido o inactivo en la receta");
      }
    }
  }

  async create(raw: unknown): Promise<ProductWithRecipe> {
    const input = productWriteSchema.parse(raw);
    await this.assertWritable(input);
    return this.products.create({
      ...input,
      imagePath: input.imagePath?.trim() ? input.imagePath.trim() : null,
    });
  }

  async update(raw: unknown): Promise<ProductWithRecipe> {
    const input = updateProductSchema.parse(raw);
    const existing = await this.products.findByIdWithRecipe(input.id);
    if (!existing) {
      throw new Error("Producto no encontrado");
    }
    await this.assertWritable(input);
    return this.products.update({
      ...input,
      imagePath: input.imagePath?.trim() ? input.imagePath.trim() : null,
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
