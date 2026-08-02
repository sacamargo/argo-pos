import { eq } from "drizzle-orm";
import {
  DATABASE_FILE_NAME,
  SEED_ADMIN_PASSWORD,
  SEED_ADMIN_USERNAME,
  SEED_META_KEY,
} from "@/database/constants";
import { appMeta, categories, paymentMethods, users } from "@/database/schema";
import { getDatabase, isTauriRuntime } from "@/infrastructure/sqlite/client";
import { hashPassword } from "@/shared/utils/password";

export type DatabaseStatus = {
  ready: boolean;
  runtime: "tauri" | "browser";
  databaseFile: string;
  seeded: boolean;
  adminUsername: string | null;
  paymentMethodCount: number;
  categoryCount: number;
  message: string;
};

async function seedIfNeeded(): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, SEED_META_KEY))
    .limit(1);

  if (existing[0]) {
    return false;
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(SEED_ADMIN_PASSWORD);

  await db.insert(users).values({
    id: crypto.randomUUID(),
    username: SEED_ADMIN_USERNAME,
    passwordHash,
    role: "admin",
    active: true,
    createdAt: now,
  });

  await db.insert(paymentMethods).values([
    {
      id: crypto.randomUUID(),
      name: "Efectivo",
      code: "cash",
      active: true,
      sortOrder: 1,
    },
    {
      id: crypto.randomUUID(),
      name: "Transferencia",
      code: "transfer",
      active: true,
      sortOrder: 2,
    },
  ]);

  await db.insert(categories).values([
    {
      id: crypto.randomUUID(),
      name: "Granizados",
      active: true,
      sortOrder: 1,
    },
    {
      id: crypto.randomUUID(),
      name: "Extras",
      active: true,
      sortOrder: 2,
    },
  ]);

  await db.insert(appMeta).values({
    key: SEED_META_KEY,
    value: now,
  });

  return true;
}

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
      message: "La base de datos solo está disponible con `pnpm tauri:dev`.",
    };
  }

  try {
    const didSeed = await seedIfNeeded();
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

    return {
      ready: true,
      runtime: "tauri",
      databaseFile: DATABASE_FILE_NAME,
      seeded: true,
      adminUsername: admin?.username ?? null,
      paymentMethodCount: paymentMethodRows.length,
      categoryCount: categoryRows.length,
      message: didSeed
        ? "Base creada, migraciones aplicadas y seed inicial cargado."
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
      message: `No se pudo inicializar SQLite: ${detail}`,
    };
  }
}
