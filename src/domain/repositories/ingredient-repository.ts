import type { Ingredient } from "@/domain/entities/ingredient";

export type CreateIngredientInput = {
  code: string;
  name: string;
  unit: string;
  minStock: number;
  initialStock?: number;
};

export type UpdateIngredientInput = {
  id: string;
  name: string;
  unit: string;
  minStock: number;
};

export interface IngredientRepository {
  listActive(): Promise<Ingredient[]>;
  listAll(): Promise<Ingredient[]>;
  findById(id: string): Promise<Ingredient | null>;
  findByCode(code: string): Promise<Ingredient | null>;
  create(
    input: CreateIngredientInput & { id: string; createdAt: string },
  ): Promise<Ingredient>;
  update(input: UpdateIngredientInput): Promise<Ingredient>;
  setActive(id: string, active: boolean): Promise<Ingredient>;
  /** Only for applying a movement delta. Never call from UI. */
  applyStockDelta(id: string, delta: number): Promise<Ingredient>;
}
