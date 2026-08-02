import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appMeta = sqliteTable("app_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const backups = sqliteTable("backups", {
  id: text("id").primaryKey(),
  filePath: text("file_path").notNull(),
  sizeBytes: integer("size_bytes"),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});
