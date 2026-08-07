import { z } from "zod";
import type { InventoryService } from "@/application/services/inventory-service";
import type { CategoryRepository } from "@/domain/repositories/category-repository";
import type { IngredientRepository } from "@/domain/repositories/ingredient-repository";
import type { ProductRepository } from "@/domain/repositories/product-repository";
import type { Product, ProductWithRecipe } from "@/domain/entities/product";
import type { Ingredient } from "@/domain/entities/ingredient";
import {
  businessCodeSchema,
  resolveCreateBusinessCode,
} from "@/shared/utils/business-code";

const recipeItemSchema = z.object({
  ingredientId: z.string().min(1, "Ingrediente obligatorio"),
  quantity: z.number().positive("La cantidad debe ser mayor a 0"),
});

const productFieldsSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  categoryId: z.string().min(1, "La categoría es obligatoria"),
  imagePath: z.string().trim().nullable().optional(),
  priceCents: z.number().int().positive("El precio debe ser mayor a 0"),
});

const productCreateFieldsSchema = productFieldsSchema.extend({
  code: businessCodeSchema.optional(),
});

const createInventorySchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  unit: z.string().trim().min(1, "La unidad es obligatoria").max(20),
  minStock: z.number().min(0, "Mínimo no puede ser negativo"),
  initialStock: z.number().min(0).optional(),
});

export const productWriteSchema = z.discriminatedUnion("fulfillmentType", [
  productCreateFieldsSchema
    .extend({
      fulfillmentType: z.literal("simple"),
      stockItemId: z.string().min(1).optional(),
      qtyPerSale: z.number().positive("La cantidad por venta debe ser mayor a 0"),
      createInventory: createInventorySchema.optional(),
      recipe: z.array(recipeItemSchema).max(0).optional().default([]),
    })
    .superRefine((data, ctx) => {
      const hasExisting = Boolean(data.stockItemId?.trim());
      const hasNew = Boolean(data.createInventory);
      if (!hasExisting && !hasNew) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Elige un ítem de inventario o crea uno nuevo en este mismo paso",
          path: ["stockItemId"],
        });
      }
      if (hasExisting && hasNew) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "No combines ítem existente y crear inventario a la vez",
          path: ["createInventory"],
        });
      }
    }),
  productCreateFieldsSchema.extend({
    fulfillmentType: z.literal("compound"),
    stockItemId: z.null().optional(),
    qtyPerSale: z.null().optional(),
    recipe: z.array(recipeItemSchema).min(1, "La receta necesita al menos un ítem"),
  }),
]);

export const updateProductSchema = z.discriminatedUnion("fulfillmentType", [
  productFieldsSchema.extend({
    id: z.string().min(1),
    fulfillmentType: z.literal("simple"),
    stockItemId: z.string().min(1, "El inventario es obligatorio"),
    qtyPerSale: z.number().positive("La cantidad por venta debe ser mayor a 0"),
    recipe: z.array(recipeItemSchema).max(0).optional().default([]),
  }),
  productFieldsSchema.extend({
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
    /** Used when Simple creates its warehouse item in the same flow. */
    private readonly inventory: InventoryService,
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

  private async assertWritable(
    input: z.infer<typeof productWriteSchema> | z.infer<typeof updateProductSchema>,
  ) {
    const category = await this.categories.findById(input.categoryId);
    if (!category || !category.active) {
      throw new Error("La categoría no existe o está inactiva");
    }

    if (input.fulfillmentType === "simple") {
      if ("createInventory" in input && input.createInventory && !input.stockItemId) {
        return;
      }
      const stockItemId =
        "stockItemId" in input && typeof input.stockItemId === "string"
          ? input.stockItemId
          : "";
      const stockItem = await this.ingredients.findById(stockItemId);
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
    const code = await resolveCreateBusinessCode("PROD", input.code, async (candidate) => {
      const existing = await this.products.findByCode(candidate);
      return existing !== null;
    });
    await this.assertWritable(input);

    let stockItemId: string | null = null;
    let qtyPerSale: number | null = null;

    if (input.fulfillmentType === "simple") {
      qtyPerSale = input.qtyPerSale;
      if (input.createInventory && !input.stockItemId) {
        const created = await this.inventory.createIngredient({
          name: input.createInventory.name?.trim() || input.name,
          unit: input.createInventory.unit,
          minStock: input.createInventory.minStock,
          initialStock: input.createInventory.initialStock ?? 0,
        });
        stockItemId = created.id;
      } else {
        stockItemId = input.stockItemId ?? null;
      }
    }

    return this.products.create({
      code,
      name: input.name,
      categoryId: input.categoryId,
      imagePath: input.imagePath?.trim() ? input.imagePath.trim() : null,
      priceCents: input.priceCents,
      fulfillmentType: input.fulfillmentType,
      recipe: input.fulfillmentType === "compound" ? input.recipe : [],
      stockItemId,
      qtyPerSale,
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
