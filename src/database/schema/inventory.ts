import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "@/database/schema/users";

export const ingredients = sqliteTable("ingredients", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  stockQuantity: real("stock_quantity").notNull().default(0),
  minStock: real("min_stock").notNull().default(0),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const inventoryMovementReasons = sqliteTable("inventory_movement_reasons", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  /** Positive stock change = in, negative = out, both = adjust */
  effect: text("effect", { enum: ["in", "out", "adjust"] }).notNull(),
});

export const inventoryMovements = sqliteTable("inventory_movements", {
  id: text("id").primaryKey(),
  ingredientId: text("ingredient_id")
    .notNull()
    .references(() => ingredients.id),
  reasonId: text("reason_id")
    .notNull()
    .references(() => inventoryMovementReasons.id),
  /** Signed quantity: +entrada / -salida. For adjust, signed delta. */
  quantity: real("quantity").notNull(),
  note: text("note"),
  referenceType: text("reference_type", {
    enum: ["sale", "sale_reversal", "manual"],
  }),
  referenceId: text("reference_id"),
  userId: text("user_id").references(() => users.id),
  createdAt: text("created_at").notNull(),
});
