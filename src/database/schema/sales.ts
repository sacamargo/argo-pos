import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { paymentMethods } from "@/database/schema/payments";
import { products } from "@/database/schema/catalog";
import { users } from "@/database/schema/users";

export { paymentMethods } from "@/database/schema/payments";

export const cashSessions = sqliteTable("cash_sessions", {
  id: text("id").primaryKey(),
  openedByUserId: text("opened_by_user_id")
    .notNull()
    .references(() => users.id),
  closedByUserId: text("closed_by_user_id").references(() => users.id),
  openingAmountCents: integer("opening_amount_cents").notNull(),
  closingAmountCents: integer("closing_amount_cents"),
  status: text("status", { enum: ["open", "closed"] }).notNull(),
  note: text("note"),
  openedAt: text("opened_at").notNull(),
  closedAt: text("closed_at"),
});

export const sales = sqliteTable("sales", {
  id: text("id").primaryKey(),
  cashSessionId: text("cash_session_id")
    .notNull()
    .references(() => cashSessions.id),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  paymentMethodId: text("payment_method_id")
    .notNull()
    .references(() => paymentMethods.id),
  status: text("status", { enum: ["completed", "reversed"] }).notNull(),
  subtotalCents: integer("subtotal_cents").notNull(),
  totalCents: integer("total_cents").notNull(),
  amountTenderedCents: integer("amount_tendered_cents"),
  changeCents: integer("change_cents"),
  createdAt: text("created_at").notNull(),
});

export const saleItems = sqliteTable("sale_items", {
  id: text("id").primaryKey(),
  saleId: text("sale_id")
    .notNull()
    .references(() => sales.id),
  productId: text("product_id").references(() => products.id),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  unitPriceCentsSnapshot: integer("unit_price_cents_snapshot").notNull(),
  /** Cost at sale time; null if product had no cost configured */
  unitCostCentsSnapshot: integer("unit_cost_cents_snapshot"),
  quantity: integer("quantity").notNull(),
  lineTotalCents: integer("line_total_cents").notNull(),
});

export const saleReversals = sqliteTable("sale_reversals", {
  id: text("id").primaryKey(),
  saleId: text("sale_id")
    .notNull()
    .unique()
    .references(() => sales.id),
  reason: text("reason").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});
