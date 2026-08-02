import { eq } from "drizzle-orm";
import type { Category } from "@/domain/entities/category";
import type { CategoryRepository } from "@/domain/repositories/category-repository";
import { categories } from "@/database/schema";
import type { AppDatabase } from "@/infrastructure/sqlite/client";

export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(private readonly db: AppDatabase) {}

  async listActive(): Promise<Category[]> {
    const rows = await this.db
      .select({
        id: categories.id,
        name: categories.name,
        active: categories.active,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(eq(categories.active, true));

    return rows
      .map((row) => ({
        id: row.id,
        name: row.name,
        active: row.active,
        sortOrder: row.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  }
}
