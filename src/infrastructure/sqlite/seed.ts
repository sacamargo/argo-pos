import { eq } from "drizzle-orm";
import {
  SEED_ADMIN_PASSWORD,
  SEED_ADMIN_USERNAME,
  SEED_CORE_META_KEY,
  SEED_META_KEY,
  SEED_VENDOR_META_KEY,
  SEED_VENDOR_PASSWORD,
  SEED_VENDOR_USERNAME,
} from "@/database/constants";
import {
  appMeta,
  categories,
  ingredients,
  inventoryMovementReasons,
  paymentMethods,
  productRecipeItems,
  products,
  settings,
  users,
} from "@/database/schema";
import { getDatabase } from "@/infrastructure/sqlite/client";
import { hashPassword } from "@/shared/utils/password";

export async function seedBootstrapIfNeeded(): Promise<boolean> {
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
      code: "CAT-GRAN",
      name: "Granizados",
      active: true,
      sortOrder: 1,
    },
    {
      id: crypto.randomUUID(),
      code: "CAT-EXTRAS",
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

export async function seedCoreIfNeeded(): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, SEED_CORE_META_KEY))
    .limit(1);

  if (existing[0]) {
    return false;
  }

  const now = new Date().toISOString();

  await db.insert(inventoryMovementReasons).values([
    {
      id: crypto.randomUUID(),
      code: "purchase_in",
      name: "Entrada",
      effect: "in",
    },
    {
      id: crypto.randomUUID(),
      code: "adjustment",
      name: "Ajuste",
      effect: "adjust",
    },
    {
      id: crypto.randomUUID(),
      code: "sale_out",
      name: "Venta",
      effect: "out",
    },
    {
      id: crypto.randomUUID(),
      code: "reversal_in",
      name: "Anulación",
      effect: "in",
    },
  ]);

  await db.insert(settings).values([
    {
      key: "business_name",
      value: "Argo POS",
      updatedAt: now,
    },
    {
      key: "backup_dir",
      value: "",
      updatedAt: now,
    },
  ]);

  const [granizados] = await db
    .select()
    .from(categories)
    .where(eq(categories.name, "Granizados"))
    .limit(1);

  const ingredientId = crypto.randomUUID();
  await db.insert(ingredients).values({
    id: ingredientId,
    code: "INV-BASE-LIMON",
    name: "Base limón",
    unit: "ml",
    stockQuantity: 5000,
    minStock: 500,
    active: true,
    createdAt: now,
  });

  const productId = crypto.randomUUID();
  await db.insert(products).values({
    id: productId,
    code: "PROD-GRAN-LIM",
    categoryId: granizados?.id ?? null,
    name: "Granizado limón",
    imagePath: null,
    priceCents: 5000,
    fulfillmentType: "compound",
    stockItemId: null,
    qtyPerSale: null,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(productRecipeItems).values({
    id: crypto.randomUUID(),
    productId,
    ingredientId,
    quantity: 250,
  });

  await db.insert(appMeta).values({
    key: SEED_CORE_META_KEY,
    value: now,
  });

  return true;
}

export async function seedVendorIfNeeded(): Promise<boolean> {
  const db = await getDatabase();
  const existing = await db
    .select()
    .from(appMeta)
    .where(eq(appMeta.key, SEED_VENDOR_META_KEY))
    .limit(1);

  if (existing[0]) {
    return false;
  }

  const [already] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.username, SEED_VENDOR_USERNAME))
    .limit(1);

  if (!already) {
    const now = new Date().toISOString();
    const passwordHash = await hashPassword(SEED_VENDOR_PASSWORD);
    await db.insert(users).values({
      id: crypto.randomUUID(),
      username: SEED_VENDOR_USERNAME,
      passwordHash,
      role: "vendedor",
      active: true,
      createdAt: now,
    });
  }

  await db.insert(appMeta).values({
    key: SEED_VENDOR_META_KEY,
    value: new Date().toISOString(),
  });

  return true;
}
