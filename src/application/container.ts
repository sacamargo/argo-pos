import { AuthService } from "@/application/services/auth-service";
import { CashSessionService } from "@/application/services/cash-session-service";
import { CategoryService } from "@/application/services/category-service";
import { DashboardService } from "@/application/services/dashboard-service";
import { InventoryService } from "@/application/services/inventory-service";
import { ProductService } from "@/application/services/product-service";
import { SaleQueryService } from "@/application/services/sale-query-service";
import { SaleService } from "@/application/services/sale-service";
import { UserService } from "@/application/services/user-service";
import { DrizzleCashSessionRepository } from "@/infrastructure/repositories/drizzle-cash-session-repository";
import { DrizzleCategoryRepository } from "@/infrastructure/repositories/drizzle-category-repository";
import { DrizzleIngredientRepository } from "@/infrastructure/repositories/drizzle-ingredient-repository";
import { DrizzleInventoryMovementRepository } from "@/infrastructure/repositories/drizzle-inventory-movement-repository";
import { DrizzlePaymentMethodRepository } from "@/infrastructure/repositories/drizzle-payment-method-repository";
import { DrizzleProductRepository } from "@/infrastructure/repositories/drizzle-product-repository";
import { DrizzleSaleRepository } from "@/infrastructure/repositories/drizzle-sale-repository";
import { DrizzleUserRepository } from "@/infrastructure/repositories/drizzle-user-repository";
import { getDatabase, withTransaction } from "@/infrastructure/sqlite/client";

export type AppServices = {
  auth: AuthService;
  categories: CategoryService;
  products: ProductService;
  inventory: InventoryService;
  cashSessions: CashSessionService;
  sales: SaleService;
  saleQueries: SaleQueryService;
  dashboard: DashboardService;
  users: UserService;
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
  const movements = new DrizzleInventoryMovementRepository(db);
  const cashSessions = new DrizzleCashSessionRepository(db);
  const paymentMethods = new DrizzlePaymentMethodRepository(db);
  const sales = new DrizzleSaleRepository(db);
  const runInTransaction = async <T>(work: () => Promise<T>) =>
    withTransaction(async () => work());

  services = {
    auth: new AuthService(users),
    categories: new CategoryService(categories),
    products: new ProductService(products, categories, ingredients),
    inventory: new InventoryService(ingredients, movements),
    cashSessions: new CashSessionService(cashSessions),
    sales: new SaleService(
      sales,
      products,
      ingredients,
      movements,
      paymentMethods,
      cashSessions,
      runInTransaction,
    ),
    saleQueries: new SaleQueryService(sales, paymentMethods),
    dashboard: new DashboardService(sales, cashSessions, ingredients),
    users: new UserService(users),
  };

  return services;
}
