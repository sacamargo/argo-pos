import { AuthService } from "@/application/services/auth-service";
import { BackupService } from "@/application/services/backup-service";
import { CashSessionService } from "@/application/services/cash-session-service";
import { CatalogImportService } from "@/application/services/catalog-import-service";
import { CatalogMaintenanceService } from "@/application/services/catalog-maintenance-service";
import { CatalogService } from "@/application/services/catalog-service";
import { CategoryService } from "@/application/services/category-service";
import { DashboardService } from "@/application/services/dashboard-service";
import { InventoryService } from "@/application/services/inventory-service";
import { ProductImageService } from "@/application/services/product-image-service";
import { ProductService } from "@/application/services/product-service";
import { SaleQueryService } from "@/application/services/sale-query-service";
import { SaleService } from "@/application/services/sale-service";
import { UserService } from "@/application/services/user-service";
import type { CatalogWorkbookCodec } from "@/domain/catalog/catalog-workbook-codec";
import { TauriBackupFileStore } from "@/infrastructure/backup/tauri-backup-file-store";
import { CatalogWorkbookValidator } from "@/infrastructure/excel/catalog-workbook-validator";
import { TauriProductImageStore } from "@/infrastructure/images/tauri-product-image-store";
import { DrizzleBackupRepository } from "@/infrastructure/repositories/drizzle-backup-repository";
import { DrizzleCashSessionRepository } from "@/infrastructure/repositories/drizzle-cash-session-repository";
import { DrizzleCategoryRepository } from "@/infrastructure/repositories/drizzle-category-repository";
import { DrizzleIngredientRepository } from "@/infrastructure/repositories/drizzle-ingredient-repository";
import { DrizzleInventoryMovementRepository } from "@/infrastructure/repositories/drizzle-inventory-movement-repository";
import { DrizzlePaymentMethodRepository } from "@/infrastructure/repositories/drizzle-payment-method-repository";
import { DrizzleProductRepository } from "@/infrastructure/repositories/drizzle-product-repository";
import { DrizzleSaleRepository } from "@/infrastructure/repositories/drizzle-sale-repository";
import { DrizzleUserRepository } from "@/infrastructure/repositories/drizzle-user-repository";
import { getDatabase, withTransaction } from "@/infrastructure/sqlite/client";

/** Lazy codec: exceljs + adapter load only when Excel ops run (not on POS boot). */
function createLazyCatalogWorkbookCodec(): CatalogWorkbookCodec {
  let instance: CatalogWorkbookCodec | null = null;
  const resolve = async (): Promise<CatalogWorkbookCodec> => {
    if (!instance) {
      const { ExcelJsCatalogWorkbookCodec } = await import(
        "@/infrastructure/excel/exceljs-catalog-workbook-codec"
      );
      instance = new ExcelJsCatalogWorkbookCodec();
    }
    return instance;
  };
  return {
    buildTemplate: async () => (await resolve()).buildTemplate(),
    buildExport: async (data) => (await resolve()).buildExport(data),
    parse: async (bytes) => (await resolve()).parse(bytes),
  };
}

export type AppServices = {
  auth: AuthService;
  categories: CategoryService;
  products: ProductService;
  productImages: ProductImageService;
  inventory: InventoryService;
  /** Facade for catalog-wide ops (future Excel import/export). */
  catalog: CatalogService;
  /** Admin wipe of catalog/inventory — not Excel. */
  catalogMaintenance: CatalogMaintenanceService;
  /** Excel workbook codec (port). */
  catalogWorkbook: CatalogWorkbookCodec;
  /** Persist validated workbook DTOs (upsert by code). */
  catalogImport: CatalogImportService;
  cashSessions: CashSessionService;
  sales: SaleService;
  saleQueries: SaleQueryService;
  dashboard: DashboardService;
  users: UserService;
  backups: BackupService;
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
  const backups = new DrizzleBackupRepository(db);
  const runInTransaction = async <T>(work: () => Promise<T>) =>
    withTransaction(async () => work());

  const categoryService = new CategoryService(categories);
  const inventoryService = new InventoryService(ingredients, movements, products);
  const productService = new ProductService(
    products,
    categories,
    ingredients,
    inventoryService,
  );
  const catalogWorkbook = createLazyCatalogWorkbookCodec();
  const workbookValidator = new CatalogWorkbookValidator();
  const catalogImport = new CatalogImportService(
    categoryService,
    inventoryService,
    productService,
    workbookValidator,
    runInTransaction,
  );

  services = {
    auth: new AuthService(users),
    categories: categoryService,
    products: productService,
    productImages: new ProductImageService(new TauriProductImageStore()),
    inventory: inventoryService,
    catalog: new CatalogService(
      categoryService,
      inventoryService,
      productService,
      catalogWorkbook,
      catalogImport,
      workbookValidator,
    ),
    catalogMaintenance: new CatalogMaintenanceService(
      productService,
      inventoryService,
      categoryService,
      products,
      ingredients,
      categories,
      sales,
      movements,
      runInTransaction,
    ),
    catalogWorkbook,
    catalogImport,
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
    backups: new BackupService(backups, new TauriBackupFileStore()),
  };

  return services;
}

export function resetAppServices(): void {
  services = null;
}
