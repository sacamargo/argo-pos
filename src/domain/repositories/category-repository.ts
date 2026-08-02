import type { Category } from "@/domain/entities/category";

export type CreateCategoryInput = {
  name: string;
  sortOrder?: number;
};

export type UpdateCategoryInput = {
  id: string;
  name: string;
  sortOrder: number;
};

export interface CategoryRepository {
  listActive(): Promise<Category[]>;
  listAll(): Promise<Category[]>;
  findById(id: string): Promise<Category | null>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(input: UpdateCategoryInput): Promise<Category>;
  setActive(id: string, active: boolean): Promise<Category>;
}
