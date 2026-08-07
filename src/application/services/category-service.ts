import { z } from "zod";
import type { Category } from "@/domain/entities/category";
import type { CategoryRepository } from "@/domain/repositories/category-repository";
import {
  businessCodeSchema,
  resolveCreateBusinessCode,
} from "@/shared/utils/business-code";

export const categorySchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean(),
  sortOrder: z.number().int(),
});

export const listCategoriesOutputSchema = z.array(categorySchema);

export const createCategoryInputSchema = z.object({
  code: businessCodeSchema.optional(),
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(80, "Máximo 80 caracteres"),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateCategoryInputSchema = z.object({
  id: z.string().min(1),
  name: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(80, "Máximo 80 caracteres"),
  sortOrder: z.number().int().min(0),
});

export const setCategoryActiveInputSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),
});

export class CategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  async listActive(): Promise<Category[]> {
    return listCategoriesOutputSchema.parse(await this.categories.listActive());
  }

  async listAll(): Promise<Category[]> {
    return listCategoriesOutputSchema.parse(await this.categories.listAll());
  }

  async findByCode(code: string): Promise<Category | null> {
    const row = await this.categories.findByCode(code);
    return row ? categorySchema.parse(row) : null;
  }

  async create(raw: unknown): Promise<Category> {
    const input = createCategoryInputSchema.parse(raw);
    const code = await resolveCreateBusinessCode("CAT", input.code, async (candidate) => {
      const existing = await this.categories.findByCode(candidate);
      return existing !== null;
    });
    return categorySchema.parse(
      await this.categories.create({
        code,
        name: input.name,
        sortOrder: input.sortOrder,
      }),
    );
  }

  async update(raw: unknown): Promise<Category> {
    const input = updateCategoryInputSchema.parse(raw);
    const existing = await this.categories.findById(input.id);
    if (!existing) {
      throw new Error("Categoría no encontrada");
    }
    return categorySchema.parse(
      await this.categories.update({
        id: input.id,
        name: input.name,
        sortOrder: input.sortOrder,
      }),
    );
  }

  async setActive(raw: unknown): Promise<Category> {
    const input = setCategoryActiveInputSchema.parse(raw);
    const existing = await this.categories.findById(input.id);
    if (!existing) {
      throw new Error("Categoría no encontrada");
    }
    return categorySchema.parse(await this.categories.setActive(input.id, input.active));
  }
}
