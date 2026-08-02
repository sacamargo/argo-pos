import { AuthService } from "@/application/services/auth-service";
import { CategoryService } from "@/application/services/category-service";
import { ProductService } from "@/application/services/product-service";
import { DrizzleCategoryRepository } from "@/infrastructure/repositories/drizzle-category-repository";
import { DrizzleIngredientRepository } from "@/infrastructure/repositories/drizzle-ingredient-repository";
import { DrizzleProductRepository } from "@/infrastructure/repositories/drizzle-product-repository";
import { DrizzleUserRepository } from "@/infrastructure/repositories/drizzle-user-repository";
import { getDatabase } from "@/infrastructure/sqlite/client";

export type AppServices = {
  auth: AuthService;
  categories: CategoryService;
  products: ProductService;
};

let services: AppServices | null = null;

export async function getAppServices(): Promise<AppServices> {
  if (services) {
    return services;
  }

  const db = await getDatabase();
  const users = new DrizzleUserRepository(db);
  const categories = new DrizzleCategoryRepository(db);
  const ingredients = new DrizzleIngredientRepository(db);
  const products = new DrizzleProductRepository(db);

  services = {
    auth: new AuthService(users),
    categories: new CategoryService(categories),
    products: new ProductService(products, categories, ingredients),
  };

  return services;
}
