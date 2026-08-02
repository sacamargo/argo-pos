import { and, desc, eq } from "drizzle-orm";
import type {
  InventoryMovement,
  InventoryMovementReason,
  InventoryMovementView,
} from "@/domain/entities/inventory";
import type {
  CreateMovementInput,
  InventoryMovementRepository,
} from "@/domain/repositories/inventory-movement-repository";
import {
  ingredients,
  inventoryMovementReasons,
  inventoryMovements,
} from "@/database/schema";
import type { AppDatabase } from "@/infrastructure/sqlite/client";

export class DrizzleInventoryMovementRepository implements InventoryMovementRepository {
  constructor(private readonly db: AppDatabase) {}

  async listReasons(): Promise<InventoryMovementReason[]> {
    const rows = await this.db
      .select({
        id: inventoryMovementReasons.id,
        code: inventoryMovementReasons.code,
        name: inventoryMovementReasons.name,
        effect: inventoryMovementReasons.effect,
      })
      .from(inventoryMovementReasons);

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      effect: row.effect,
    }));
  }

  async findReasonByCode(code: string): Promise<InventoryMovementReason | null> {
    const [row] = await this.db
      .select({
        id: inventoryMovementReasons.id,
        code: inventoryMovementReasons.code,
        name: inventoryMovementReasons.name,
        effect: inventoryMovementReasons.effect,
      })
      .from(inventoryMovementReasons)
      .where(eq(inventoryMovementReasons.code, code))
      .limit(1);

    return row
      ? {
          id: row.id,
          code: row.code,
          name: row.name,
          effect: row.effect,
        }
      : null;
  }

  async create(input: CreateMovementInput): Promise<InventoryMovement> {
    const movement: InventoryMovement = {
      id: crypto.randomUUID(),
      ingredientId: input.ingredientId,
      reasonId: input.reasonId,
      quantity: input.quantity,
      note: input.note ?? null,
      referenceType: input.referenceType ?? "manual",
      referenceId: input.referenceId ?? null,
      userId: input.userId ?? null,
      createdAt: new Date().toISOString(),
    };

    await this.db.insert(inventoryMovements).values(movement);
    return movement;
  }

  async listRecent(limit = 50): Promise<InventoryMovementView[]> {
    const rows = await this.db
      .select({
        id: inventoryMovements.id,
        ingredientId: inventoryMovements.ingredientId,
        reasonId: inventoryMovements.reasonId,
        quantity: inventoryMovements.quantity,
        note: inventoryMovements.note,
        referenceType: inventoryMovements.referenceType,
        referenceId: inventoryMovements.referenceId,
        userId: inventoryMovements.userId,
        createdAt: inventoryMovements.createdAt,
        ingredientName: ingredients.name,
        reasonName: inventoryMovementReasons.name,
        reasonCode: inventoryMovementReasons.code,
      })
      .from(inventoryMovements)
      .innerJoin(ingredients, eq(inventoryMovements.ingredientId, ingredients.id))
      .innerJoin(
        inventoryMovementReasons,
        eq(inventoryMovements.reasonId, inventoryMovementReasons.id),
      )
      .orderBy(desc(inventoryMovements.createdAt))
      .limit(limit);

    return rows.map((row) => ({
      id: row.id,
      ingredientId: row.ingredientId,
      reasonId: row.reasonId,
      quantity: row.quantity,
      note: row.note,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      userId: row.userId,
      createdAt: row.createdAt,
      ingredientName: row.ingredientName,
      reasonName: row.reasonName,
      reasonCode: row.reasonCode,
    }));
  }

  async listByReference(
    referenceType: "sale" | "sale_reversal" | "manual",
    referenceId: string,
  ): Promise<InventoryMovement[]> {
    const rows = await this.db
      .select()
      .from(inventoryMovements)
      .where(
        and(
          eq(inventoryMovements.referenceType, referenceType),
          eq(inventoryMovements.referenceId, referenceId),
        ),
      );

    return rows.map((row) => ({
      id: row.id,
      ingredientId: row.ingredientId,
      reasonId: row.reasonId,
      quantity: row.quantity,
      note: row.note,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      userId: row.userId,
      createdAt: row.createdAt,
    }));
  }
}
