export type MovementEffect = "in" | "out" | "adjust";

export type InventoryMovementReason = {
  id: string;
  code: string;
  name: string;
  effect: MovementEffect;
};

export type InventoryMovement = {
  id: string;
  ingredientId: string;
  reasonId: string;
  quantity: number;
  note: string | null;
  referenceType: "sale" | "sale_reversal" | "manual" | null;
  referenceId: string | null;
  userId: string | null;
  createdAt: string;
};

export type InventoryMovementView = InventoryMovement & {
  ingredientName: string;
  reasonName: string;
  reasonCode: string;
};
