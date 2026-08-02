"use server";

import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/modules/core/errors/app-error";
import { z } from "zod";

const movementSchema = z.object({
  ingredientId: z.uuid(),
  qty: z.number().refine((value) => value !== 0, "Cantidad distinta de 0"),
  notes: z.string().max(500).optional(),
  reasonCode: z.enum(["purchase", "adjustment", "waste"]),
});

const ingredientSchema = z.object({
  name: z.string().min(2).max(120),
  unit: z.enum(["ml", "g", "unit"]),
  minStock: z.number().nonnegative(),
  stockTolerance: z.number().nonnegative().default(0),
  costPerUnit: z.number().nonnegative().default(0),
  initialQty: z.number().nonnegative().default(0),
});

export async function listIngredients() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ingredients")
      .select(
        "id, name, unit, stock_qty, min_stock, stock_tolerance, cost_per_unit, is_active",
      )
      .order("name");

    if (error) throw error;

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      unit: row.unit as "ml" | "g" | "unit",
      stockQty: Number(row.stock_qty),
      minStock: Number(row.min_stock),
      stockTolerance: Number(row.stock_tolerance),
      costPerUnit: Number(row.cost_per_unit),
      isActive: row.is_active,
      isCritical: Number(row.stock_qty) <= Number(row.min_stock),
    }));
  } catch (error) {
    throw toAppError(error, "INGREDIENTS_LIST_FAILED");
  }
}

export async function listRecentMovements(limit = 30) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("inventory_movements")
      .select(
        "id, qty, stock_after, notes, created_at, ingredients(name, unit), inventory_reasons(name, code)",
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row) => {
      const ingredient = row.ingredients as
        | { name: string; unit: string }
        | { name: string; unit: string }[]
        | null;
      const reason = row.inventory_reasons as
        | { name: string; code: string }
        | { name: string; code: string }[]
        | null;

      return {
        id: row.id,
        qty: Number(row.qty),
        stockAfter: Number(row.stock_after),
        notes: row.notes,
        createdAt: row.created_at,
        ingredientName: Array.isArray(ingredient)
          ? (ingredient[0]?.name ?? "—")
          : (ingredient?.name ?? "—"),
        unit: Array.isArray(ingredient)
          ? (ingredient[0]?.unit ?? "")
          : (ingredient?.unit ?? ""),
        reasonName: Array.isArray(reason)
          ? (reason[0]?.name ?? "—")
          : (reason?.name ?? "—"),
      };
    });
  } catch (error) {
    throw toAppError(error, "MOVEMENTS_LIST_FAILED");
  }
}

async function getProfileContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHORIZED");

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_id")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("MISSING_PROFILE");
  return { supabase, userId: user.id, businessId: profile.business_id };
}

export async function createInventoryMovement(input: z.infer<typeof movementSchema>) {
  try {
    const parsed = movementSchema.parse(input);
    const { supabase, userId, businessId } = await getProfileContext();

    const { data: reason } = await supabase
      .from("inventory_reasons")
      .select("id")
      .eq("code", parsed.reasonCode)
      .single();

    if (!reason) throw new Error("MISSING_REASON");

    let qty = parsed.qty;
    if (parsed.reasonCode === "purchase") {
      qty = Math.abs(qty);
    }
    if (parsed.reasonCode === "waste") {
      qty = -Math.abs(qty);
    }

    const { error } = await supabase.from("inventory_movements").insert({
      business_id: businessId,
      ingredient_id: parsed.ingredientId,
      reason_id: reason.id,
      qty,
      stock_after: 0,
      notes: parsed.notes ?? null,
      created_by: userId,
    });

    if (error) throw error;
    return { ok: true as const };
  } catch (error) {
    throw toAppError(error, "INVENTORY_MOVEMENT_FAILED");
  }
}

export async function createIngredient(input: z.infer<typeof ingredientSchema>) {
  try {
    const parsed = ingredientSchema.parse(input);
    const { supabase, userId, businessId } = await getProfileContext();

    const { data: ingredient, error } = await supabase
      .from("ingredients")
      .insert({
        business_id: businessId,
        name: parsed.name,
        unit: parsed.unit,
        stock_qty: 0,
        min_stock: parsed.minStock,
        stock_tolerance: parsed.stockTolerance,
        cost_per_unit: parsed.costPerUnit,
        created_by: userId,
        updated_by: userId,
      })
      .select("id")
      .single();

    if (error) throw error;

    if (parsed.initialQty > 0) {
      await createInventoryMovement({
        ingredientId: ingredient.id,
        qty: parsed.initialQty,
        reasonCode: "purchase",
        notes: "Stock inicial",
      });
    }

    return { ok: true as const, id: ingredient.id };
  } catch (error) {
    throw toAppError(error, "INGREDIENT_CREATE_FAILED");
  }
}

/** @deprecated use createInventoryMovement */
export async function createInventoryAdjustment(input: {
  ingredientId: string;
  qty: number;
  notes?: string;
}) {
  return createInventoryMovement({
    ingredientId: input.ingredientId,
    qty: input.qty,
    notes: input.notes,
    reasonCode: "adjustment",
  });
}
