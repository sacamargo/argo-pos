import { asc, eq } from "drizzle-orm";
import type { Category } from "@/domain/entities/category";
import type {
  CategoryRepository,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "@/domain/repositories/category-repository";
import { categories } from "@/database/schema";
import type { AppDatabase } from "@/infrastructure/sqlite/client";
import { normalizeBusinessCode } from "@/shared/utils/business-code";

function mapRow(row: {
  id: string;
  code: string;
  name: string;
  active: boolean;
  sortOrder: number;
}): Category {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}

const selectFields = {
  id: categories.id,
  code: categories.code,
  name: categories.name,
  active: categories.active,
  sortOrder: categories.sortOrder,
};

export class DrizzleCategoryRepository implements CategoryRepository {
  constructor(private readonly db: AppDatabase) {}

  async listActive(): Promise<Category[]> {
    const rows = await this.db
      .select(selectFields)
      .from(categories)
      .where(eq(categories.active, true))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    return rows.map(mapRow);
  }

  async listAll(): Promise<Category[]> {
    const rows = await this.db
      .select(selectFields)
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name));
    return rows.map(mapRow);
  }

  async findById(id: string): Promise<Category | null> {
    const [row] = await this.db
      .select(selectFields)
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    return row ? mapRow(row) : null;
  }

  async findByCode(code: string): Promise<Category | null> {
    const [row] = await this.db
      .select(selectFields)
      .from(categories)
      .where(eq(categories.code, normalizeBusinessCode(code)))
      .limit(1);
    return row ? mapRow(row) : null;
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const category: Category = {
      id: crypto.randomUUID(),
      code: normalizeBusinessCode(input.code),
      name: input.name,
      active: true,
      sortOrder: input.sortOrder ?? 0,
    };
    await this.db.insert(categories).values(category);
    return category;
  }

  async update(input: UpdateCategoryInput): Promise<Category> {
    await this.db
      .update(categories)
      .set({
        name: input.name,
        sortOrder: input.sortOrder,
      })
      .where(eq(categories.id, input.id));
    const updated = await this.findById(input.id);
    if (!updated) {
      throw new Error("Categoría no encontrada tras actualizar");
    }
    return updated;
  }

  async setActive(id: string, active: boolean): Promise<Category> {
    await this.db.update(categories).set({ active }).where(eq(categories.id, id));
    const updated = await this.findById(id);
    if (!updated) {
      throw new Error("Categoría no encontrada tras cambiar estado");
    }
    return updated;
  }

  async deleteById(id: string): Promise<void> {
    await this.db.delete(categories).where(eq(categories.id, id));
  }
}
