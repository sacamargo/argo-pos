import type {
  InventoryMovement,
  InventoryMovementReason,
  InventoryMovementView,
} from "@/domain/entities/inventory";

export type CreateMovementInput = {
  ingredientId: string;
  reasonId: string;
  quantity: number;
  note?: string | null;
  userId?: string | null;
  referenceType?: "sale" | "sale_reversal" | "manual" | null;
  referenceId?: string | null;
};

export interface InventoryMovementRepository {
  listReasons(): Promise<InventoryMovementReason[]>;
  findReasonByCode(code: string): Promise<InventoryMovementReason | null>;
  create(input: CreateMovementInput): Promise<InventoryMovement>;
  listRecent(limit?: number): Promise<InventoryMovementView[]>;
  listByReference(
    referenceType: "sale" | "sale_reversal" | "manual",
    referenceId: string,
  ): Promise<InventoryMovement[]>;
  /** True if ingredient has any movement (FK blocks hard delete unless movements are removed). */
  hasMovementsForIngredient(ingredientId: string): Promise<boolean>;
  /** Removes movement history for an ingredient so it can be hard-deleted. */
  deleteByIngredientId(ingredientId: string): Promise<number>;
}
