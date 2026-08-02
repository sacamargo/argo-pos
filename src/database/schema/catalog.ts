import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { ingredients } from "@/database/schema/inventory";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").references(() => categories.id),
  name: text("name").notNull(),
  imagePath: text("image_path"),
  priceCents: integer("price_cents").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const productRecipeItems = sqliteTable("product_recipe_items", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  ingredientId: text("ingredient_id")
    .notNull()
    .references(() => ingredients.id),
  quantity: real("quantity").notNull(),
});
