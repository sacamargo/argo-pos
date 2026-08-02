import type { Ingredient } from "@/domain/entities/ingredient";

export interface IngredientRepository {
  listActive(): Promise<Ingredient[]>;
  findById(id: string): Promise<Ingredient | null>;
}
