import { eq } from "drizzle-orm";
import { DATABASE_FILE_NAME, SEED_ADMIN_USERNAME } from "@/database/constants";
import {
  categories,
  ingredients,
  paymentMethods,
  products,
  users,
} from "@/database/schema";
import { getDatabase, isTauriRuntime } from "@/infrastructure/sqlite/client";
import {
  seedBootstrapIfNeeded,
  seedCoreIfNeeded,
  seedVendorIfNeeded,
} from "@/infrastructure/sqlite/seed";

export type DatabaseStatus = {
  ready: boolean;
  runtime: "tauri" | "browser";
  databaseFile: string;
  seeded: boolean;
  adminUsername: string | null;
  paymentMethodCount: number;
  categoryCount: number;
  productCount: number;
  ingredientCount: number;
  message: string;
};

export async function ensureDatabaseReady(): Promise<DatabaseStatus> {
  if (!isTauriRuntime()) {
    return {
      ready: false,
      runtime: "browser",
      databaseFile: DATABASE_FILE_NAME,
      seeded: false,
      adminUsername: null,
      paymentMethodCount: 0,
      categoryCount: 0,
      productCount: 0,
      ingredientCount: 0,
      message: "La base de datos solo está disponible con `pnpm tauri:dev`.",
    };
  }

  try {
    const didBootstrap = await seedBootstrapIfNeeded();
    const didCore = await seedCoreIfNeeded();
    const didVendor = await seedVendorIfNeeded();
    const db = await getDatabase();

    const [admin] = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.username, SEED_ADMIN_USERNAME))
      .limit(1);

    const paymentMethodRows = await db
      .select({ id: paymentMethods.id })
      .from(paymentMethods);
    const categoryRows = await db.select({ id: categories.id }).from(categories);
    const productRows = await db.select({ id: products.id }).from(products);
    const ingredientRows = await db.select({ id: ingredients.id }).from(ingredients);

    return {
      ready: true,
      runtime: "tauri",
      databaseFile: DATABASE_FILE_NAME,
      seeded: true,
      adminUsername: admin?.username ?? null,
      paymentMethodCount: paymentMethodRows.length,
      categoryCount: categoryRows.length,
      productCount: productRows.length,
      ingredientCount: ingredientRows.length,
      message:
        didBootstrap || didCore || didVendor
          ? "Schema listo: migraciones aplicadas y seed reproducible cargado."
          : "Base lista. Migraciones al día; seed ya existía.",
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Error desconocido";
    return {
      ready: false,
      runtime: "tauri",
      databaseFile: DATABASE_FILE_NAME,
      seeded: false,
      adminUsername: null,
      paymentMethodCount: 0,
      categoryCount: 0,
      productCount: 0,
      ingredientCount: 0,
      message: `No se pudo inicializar SQLite: ${detail}`,
    };
  }
}
