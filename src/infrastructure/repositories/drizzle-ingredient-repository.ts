import { asc, eq } from "drizzle-orm";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { IngredientRepository } from "@/domain/repositories/ingredient-repository";
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

export class DrizzleIngredientRepository implements IngredientRepository {
  constructor(private readonly db: AppDatabase) {}

  async listActive(): Promise<Ingredient[]> {
    const rows = await this.db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        unit: ingredients.unit,
        stockQuantity: ingredients.stockQuantity,
        minStock: ingredients.minStock,
        active: ingredients.active,
        createdAt: ingredients.createdAt,
      })
      .from(ingredients)
      .where(eq(ingredients.active, true))
      .orderBy(asc(ingredients.name));

    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Ingredient | null> {
    const [row] = await this.db
      .select({
        id: ingredients.id,
        name: ingredients.name,
        unit: ingredients.unit,
        stockQuantity: ingredients.stockQuantity,
        minStock: ingredients.minStock,
        active: ingredients.active,
        createdAt: ingredients.createdAt,
      })
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1);

    return row ? mapRow(row) : null;
  }
}
