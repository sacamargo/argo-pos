import type { Category } from "@/domain/entities/category";

export interface CategoryRepository {
  listActive(): Promise<Category[]>;
}
