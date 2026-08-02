import { AuthService } from "@/application/services/auth-service";
import { CategoryService } from "@/application/services/category-service";
import { DrizzleCategoryRepository } from "@/infrastructure/repositories/drizzle-category-repository";
import { DrizzleUserRepository } from "@/infrastructure/repositories/drizzle-user-repository";
import { getDatabase } from "@/infrastructure/sqlite/client";

export type AppServices = {
  auth: AuthService;
  categories: CategoryService;
};

let services: AppServices | null = null;

export async function getAppServices(): Promise<AppServices> {
  if (services) {
    return services;
  }

  const db = await getDatabase();
  const users = new DrizzleUserRepository(db);
  const categories = new DrizzleCategoryRepository(db);

  services = {
    auth: new AuthService(users),
    categories: new CategoryService(categories),
  };

  return services;
}
