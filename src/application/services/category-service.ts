import { z } from "zod";
import type { Category } from "@/domain/entities/category";
import type { CategoryRepository } from "@/domain/repositories/category-repository";

export const listCategoriesOutputSchema = z.array(
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    active: z.boolean(),
    sortOrder: z.number().int(),
  }),
);

export class CategoryService {
  constructor(private readonly categories: CategoryRepository) {}

  async listActive(): Promise<Category[]> {
    const rows = await this.categories.listActive();
    return listCategoriesOutputSchema.parse(rows);
  }
}
