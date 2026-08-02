import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const paymentMethods = sqliteTable("payment_methods", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});
