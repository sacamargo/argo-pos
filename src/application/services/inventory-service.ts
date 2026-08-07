import { z } from "zod";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { InventoryMovementView } from "@/domain/entities/inventory";
import type { IngredientRepository } from "@/domain/repositories/ingredient-repository";
import type { InventoryMovementRepository } from "@/domain/repositories/inventory-movement-repository";
import type { ProductRepository } from "@/domain/repositories/product-repository";
import {
  businessCodeSchema,
  resolveCreateBusinessCode,
} from "@/shared/utils/business-code";

export const createIngredientSchema = z.object({
  code: businessCodeSchema.optional(),
  name: z.string().trim().min(1, "Nombre obligatorio").max(120),
  unit: z.string().trim().min(1, "Unidad obligatoria").max(20),
  minStock: z.number().min(0, "Mínimo no puede ser negativo"),
  initialStock: z.number().min(0).optional(),
});

export const updateIngredientSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "Nombre obligatorio").max(120),
  unit: z.string().trim().min(1, "Unidad obligatoria").max(20),
  minStock: z.number().min(0, "Mínimo no puede ser negativo"),
});

export const setIngredientActiveSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export const purchaseInSchema = z.object({
  ingredientId: z.string().min(1),
  quantity: z.number().positive("La cantidad de entrada debe ser mayor a 0"),
  note: z.string().trim().max(200).optional(),
  userId: z.string().min(1).optional(),
});

export const adjustmentSchema = z.object({
  ingredientId: z.string().min(1),
  /** Signed delta: +suma / −resta */
  quantity: z.number().refine((value) => value !== 0, "El ajuste no puede ser 0"),
  note: z.string().trim().min(1, "El ajuste requiere una nota").max(200),
  userId: z.string().min(1).optional(),
});

export class InventoryService {
  constructor(
    private readonly ingredients: IngredientRepository,
    private readonly movements: InventoryMovementRepository,
    /** Blocks deactivating items still linked to active POS products. */
    private readonly products: ProductRepository,
  ) {}

  async listIngredients(): Promise<Ingredient[]> {
    return this.ingredients.listAll();
  }

  async listLowStock(): Promise<Ingredient[]> {
    const rows = await this.ingredients.listAll();
    return rows.filter((item) => item.active && item.stockQuantity <= item.minStock);
  }

  async listMovements(limit = 50): Promise<InventoryMovementView[]> {
    return this.movements.listRecent(limit);
  }

  async findByCode(code: string): Promise<Ingredient | null> {
    return this.ingredients.findByCode(code);
  }

  async createIngredient(raw: unknown): Promise<Ingredient> {
    const input = createIngredientSchema.parse(raw);
    const code = await resolveCreateBusinessCode("INV", input.code, async (candidate) => {
      const existing = await this.ingredients.findByCode(candidate);
      return existing !== null;
    });
    const now = new Date().toISOString();
    const created = await this.ingredients.create({
      id: crypto.randomUUID(),
      code,
      name: input.name,
      unit: input.unit,
      minStock: input.minStock,
      initialStock: 0,
      createdAt: now,
    });

    if (input.initialStock && input.initialStock > 0) {
      return this.recordPurchaseIn({
        ingredientId: created.id,
        quantity: input.initialStock,
        note: "Stock inicial",
      });
    }

    return created;
  }

  async updateIngredient(raw: unknown): Promise<Ingredient> {
    const input = updateIngredientSchema.parse(raw);
    const existing = await this.ingredients.findById(input.id);
    if (!existing) {
      throw new Error("Ítem de inventario no encontrado");
    }
    return this.ingredients.update({
      id: input.id,
      name: input.name,
      unit: input.unit,
      minStock: input.minStock,
    });
  }

  async setIngredientActive(raw: unknown): Promise<Ingredient> {
    const input = setIngredientActiveSchema.parse(raw);
    const existing = await this.ingredients.findById(input.id);
    if (!existing) {
      throw new Error("Ítem de inventario no encontrado");
    }

    if (!input.active) {
      const links = await this.products.findActiveLinksToIngredient(input.id);
      if (links.asStock || links.inRecipe) {
        throw new Error(
          "No puedes ocultar este ítem: está ligado a un producto activo en Catálogo. Desactiva o edita ese producto primero.",
        );
      }
    }

    return this.ingredients.setActive(input.id, input.active);
  }

  async recordPurchaseIn(raw: unknown): Promise<Ingredient> {
    const input = purchaseInSchema.parse(raw);
    const ingredient = await this.ingredients.findById(input.ingredientId);
    if (!ingredient || !ingredient.active) {
      throw new Error("Ítem de inventario no encontrado o inactivo");
    }

    const reason = await this.movements.findReasonByCode("purchase_in");
    if (!reason) {
      throw new Error("Motivo de entrada no configurado");
    }

    await this.movements.create({
      ingredientId: input.ingredientId,
      reasonId: reason.id,
      quantity: input.quantity,
      note: input.note ?? null,
      userId: input.userId ?? null,
      referenceType: "manual",
    });

    return this.ingredients.applyStockDelta(input.ingredientId, input.quantity);
  }

  async recordAdjustment(raw: unknown): Promise<Ingredient> {
    const input = adjustmentSchema.parse(raw);
    const ingredient = await this.ingredients.findById(input.ingredientId);
    if (!ingredient || !ingredient.active) {
      throw new Error("Ítem de inventario no encontrado o inactivo");
    }

    const reason = await this.movements.findReasonByCode("adjustment");
    if (!reason) {
      throw new Error("Motivo de ajuste no configurado");
    }

    await this.movements.create({
      ingredientId: input.ingredientId,
      reasonId: reason.id,
      quantity: input.quantity,
      note: input.note,
      userId: input.userId ?? null,
      referenceType: "manual",
    });

    return this.ingredients.applyStockDelta(input.ingredientId, input.quantity);
  }
}
