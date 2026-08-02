import { asc, eq } from "drizzle-orm";
import type { Ingredient } from "@/domain/entities/ingredient";
import type {
  CreateIngredientInput,
  IngredientRepository,
  UpdateIngredientInput,
} from "@/domain/repositories/ingredient-repository";
import { ingredients } from "@/database/schema";
import type { AppDatabase } from "@/infrastructure/sqlite/client";

function mapRow(row: {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  minStock: number;
  active: boolean;
  createdAt: string;
}): Ingredient {
  return {
    id: row.id,
    name: row.name,
    unit: row.unit,
    stockQuantity: row.stockQuantity,
    minStock: row.minStock,
    active: row.active,
    createdAt: row.createdAt,
  };
}

const selectFields = {
  id: ingredients.id,
  name: ingredients.name,
  unit: ingredients.unit,
  stockQuantity: ingredients.stockQuantity,
  minStock: ingredients.minStock,
  active: ingredients.active,
  createdAt: ingredients.createdAt,
};

export class DrizzleIngredientRepository implements IngredientRepository {
  constructor(private readonly db: AppDatabase) {}

  async listActive(): Promise<Ingredient[]> {
    const rows = await this.db
      .select(selectFields)
      .from(ingredients)
      .where(eq(ingredients.active, true))
      .orderBy(asc(ingredients.name));
    return rows.map(mapRow);
  }

  async listAll(): Promise<Ingredient[]> {
    const rows = await this.db
      .select(selectFields)
      .from(ingredients)
      .orderBy(asc(ingredients.name));
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Ingredient | null> {
    const [row] = await this.db
      .select(selectFields)
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1);
    return row ? mapRow(row) : null;
  }

  async create(
    input: CreateIngredientInput & { id: string; createdAt: string },
  ): Promise<Ingredient> {
    const ingredient: Ingredient = {
      id: input.id,
      name: input.name,
      unit: input.unit,
      stockQuantity: input.initialStock ?? 0,
      minStock: input.minStock,
      active: true,
      createdAt: input.createdAt,
    };
    await this.db.insert(ingredients).values(ingredient);
    return ingredient;
  }

  async update(input: UpdateIngredientInput): Promise<Ingredient> {
    await this.db
      .update(ingredients)
      .set({
        name: input.name,
        unit: input.unit,
        minStock: input.minStock,
      })
      .where(eq(ingredients.id, input.id));
    const updated = await this.findById(input.id);
    if (!updated) {
      throw new Error("Ingrediente no encontrado tras actualizar");
    }
    return updated;
  }

  async setActive(id: string, active: boolean): Promise<Ingredient> {
    await this.db.update(ingredients).set({ active }).where(eq(ingredients.id, id));
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Ingrediente no encontrado tras cambiar estado");
    }
    return updated;
  }

  async applyStockDelta(id: string, delta: number): Promise<Ingredient> {
    const current = await this.findById(id);
    if (!current) {
      throw new Error("Ingrediente no encontrado");
    }
    const nextStock = current.stockQuantity + delta;
    await this.db
      .update(ingredients)
      .set({ stockQuantity: nextStock })
      .where(eq(ingredients.id, id));
    return { ...current, stockQuantity: nextStock };
  }
}
