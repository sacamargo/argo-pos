import { describe, expect, it, vi } from "vitest";
import {
  CatalogImportService,
  type CatalogImportValidator,
} from "@/application/services/catalog-import-service";
import type { CategoryService } from "@/application/services/category-service";
import type { InventoryService } from "@/application/services/inventory-service";
import type { ProductService } from "@/application/services/product-service";
import type { CatalogWorkbookDto } from "@/domain/catalog/catalog-workbook-dto";
import type { Category } from "@/domain/entities/category";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { ProductWithRecipe } from "@/domain/entities/product";
import type { TransactionRunner } from "@/domain/repositories/transaction-runner";
import { CatalogWorkbookValidator } from "@/infrastructure/excel/catalog-workbook-validator";
import { pesosToCents } from "@/shared/utils/money";

type Store = {
  categories: Map<string, Category>;
  inventory: Map<string, Ingredient>;
  products: Map<string, ProductWithRecipe>;
};

function cloneStore(store: Store): Store {
  return {
    categories: new Map(
      [...store.categories.entries()].map(([k, v]) => [k, { ...v }]),
    ),
    inventory: new Map(
      [...store.inventory.entries()].map(([k, v]) => [k, { ...v }]),
    ),
    products: new Map(
      [...store.products.entries()].map(([k, v]) => [
        k,
        { ...v, recipe: v.recipe.map((item) => ({ ...item })) },
      ]),
    ),
  };
}

function createHarness(options?: { failOnProductCode?: string }) {
  const store: Store = {
    categories: new Map(),
    inventory: new Map(),
    products: new Map(),
  };

  const runInTransaction: TransactionRunner = async (work) => {
    const snapshot = cloneStore(store);
    try {
      return await work();
    } catch (error) {
      store.categories = snapshot.categories;
      store.inventory = snapshot.inventory;
      store.products = snapshot.products;
      throw error;
    }
  };

  const categories = {
    findByCode: vi.fn(async (code: string) => {
      const key = code.trim().toUpperCase();
      return (
        [...store.categories.values()].find((row) => row.code.toUpperCase() === key) ??
        null
      );
    }),
    create: vi.fn(async (raw: { code: string; name: string; sortOrder?: number }) => {
      const row: Category = {
        id: crypto.randomUUID(),
        code: raw.code.trim().toUpperCase(),
        name: raw.name,
        active: true,
        sortOrder: raw.sortOrder ?? 0,
      };
      store.categories.set(row.id, row);
      return row;
    }),
    update: vi.fn(async (raw: { id: string; name: string; sortOrder: number }) => {
      const existing = store.categories.get(raw.id);
      if (!existing) {
        throw new Error("Categoría no encontrada");
      }
      const next = { ...existing, name: raw.name, sortOrder: raw.sortOrder };
      store.categories.set(raw.id, next);
      return next;
    }),
    setActive: vi.fn(async (raw: { id: string; active: boolean }) => {
      const existing = store.categories.get(raw.id);
      if (!existing) {
        throw new Error("Categoría no encontrada");
      }
      const next = { ...existing, active: raw.active };
      store.categories.set(raw.id, next);
      return next;
    }),
  } as unknown as CategoryService;

  const inventory = {
    findByCode: vi.fn(async (code: string) => {
      const key = code.trim().toUpperCase();
      return (
        [...store.inventory.values()].find((row) => row.code.toUpperCase() === key) ??
        null
      );
    }),
    createIngredient: vi.fn(
      async (raw: {
        code: string;
        name: string;
        unit: string;
        minStock: number;
        initialStock?: number;
      }) => {
        const row: Ingredient = {
          id: crypto.randomUUID(),
          code: raw.code.trim().toUpperCase(),
          name: raw.name,
          unit: raw.unit,
          stockQuantity: raw.initialStock ?? 0,
          minStock: raw.minStock,
          active: true,
          createdAt: new Date().toISOString(),
        };
        store.inventory.set(row.id, row);
        return row;
      },
    ),
    updateIngredient: vi.fn(
      async (raw: { id: string; name: string; unit: string; minStock: number }) => {
        const existing = store.inventory.get(raw.id);
        if (!existing) {
          throw new Error("Ingrediente no encontrado");
        }
        const next = {
          ...existing,
          name: raw.name,
          unit: raw.unit,
          minStock: raw.minStock,
        };
        store.inventory.set(raw.id, next);
        return next;
      },
    ),
    recordAdjustment: vi.fn(
      async (raw: { ingredientId: string; quantity: number; note: string }) => {
        const existing = store.inventory.get(raw.ingredientId);
        if (!existing) {
          throw new Error("Ingrediente no encontrado");
        }
        const next = {
          ...existing,
          stockQuantity: existing.stockQuantity + raw.quantity,
        };
        store.inventory.set(raw.ingredientId, next);
        return next;
      },
    ),
  } as unknown as InventoryService;

  const products = {
    findByCode: vi.fn(async (code: string) => {
      const key = code.trim().toUpperCase();
      return (
        [...store.products.values()].find((row) => row.code.toUpperCase() === key) ??
        null
      );
    }),
    create: vi.fn(async (raw: Record<string, unknown>) => {
      const code = String(raw.code).toUpperCase();
      if (options?.failOnProductCode && code === options.failOnProductCode) {
        throw new Error("UNIQUE constraint failed");
      }
      const row: ProductWithRecipe = {
        id: crypto.randomUUID(),
        code,
        categoryId: String(raw.categoryId),
        name: String(raw.name),
        imagePath: null,
        priceCents: Number(raw.priceCents),
        fulfillmentType: raw.fulfillmentType as "simple" | "compound",
        stockItemId: (raw.stockItemId as string | null) ?? null,
        qtyPerSale: (raw.qtyPerSale as number | null) ?? null,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        recipe:
          raw.fulfillmentType === "compound"
            ? ((raw.recipe as Array<{ ingredientId: string; quantity: number }>) ?? []).map(
                (item) => ({
                  id: crypto.randomUUID(),
                  productId: "pending",
                  ingredientId: item.ingredientId,
                  quantity: item.quantity,
                }),
              )
            : [],
      };
      row.recipe = row.recipe.map((item) => ({ ...item, productId: row.id }));
      store.products.set(row.id, row);
      return row;
    }),
    update: vi.fn(async (raw: Record<string, unknown>) => {
      const existing = store.products.get(String(raw.id));
      if (!existing) {
        throw new Error("Producto no encontrado");
      }
      const next: ProductWithRecipe = {
        ...existing,
        name: String(raw.name),
        categoryId: String(raw.categoryId),
        priceCents: Number(raw.priceCents),
        fulfillmentType: raw.fulfillmentType as "simple" | "compound",
        stockItemId: (raw.stockItemId as string | null) ?? null,
        qtyPerSale: (raw.qtyPerSale as number | null) ?? null,
        updatedAt: new Date().toISOString(),
        recipe:
          raw.fulfillmentType === "compound"
            ? ((raw.recipe as Array<{ ingredientId: string; quantity: number }>) ?? []).map(
                (item) => ({
                  id: crypto.randomUUID(),
                  productId: existing.id,
                  ingredientId: item.ingredientId,
                  quantity: item.quantity,
                }),
              )
            : [],
      };
      store.products.set(existing.id, next);
      return next;
    }),
    setActive: vi.fn(async (raw: { id: string; active: boolean }) => {
      const existing = store.products.get(raw.id);
      if (!existing) {
        throw new Error("Producto no encontrado");
      }
      const next = { ...existing, active: raw.active };
      store.products.set(raw.id, next);
      return next;
    }),
  } as unknown as ProductService;

  const validator: CatalogImportValidator = new CatalogWorkbookValidator();
  const service = new CatalogImportService(
    categories,
    inventory,
    products,
    validator,
    runInTransaction,
  );

  return { store, service, categories, inventory, products };
}

function sampleDto(): CatalogWorkbookDto {
  return {
    categories: [
      { code: "CAT-BEBIDAS", name: "Bebidas", active: true, sortOrder: 1 },
    ],
    inventory: [
      {
        code: "INV-VASO",
        name: "Vaso",
        unit: "und",
        stockQuantity: 10,
        minStock: 2,
        active: true,
        updateStock: false,
      },
      {
        code: "INV-BASE",
        name: "Base limón",
        unit: "ml",
        stockQuantity: 1000,
        minStock: 100,
        active: true,
        updateStock: false,
      },
    ],
    products: [
      {
        code: "PROD-AGUA",
        name: "Agua",
        categoryCode: "CAT-BEBIDAS",
        fulfillmentType: "simple",
        pricePesos: 25,
        active: true,
        inventoryCode: "INV-VASO",
        qtyPerSale: 1,
      },
      {
        code: "PROD-GRAN",
        name: "Granizado",
        categoryCode: "CAT-BEBIDAS",
        fulfillmentType: "compound",
        pricePesos: 80,
        active: true,
        inventoryCode: null,
        qtyPerSale: null,
      },
    ],
    recipes: [
      { productCode: "PROD-GRAN", inventoryCode: "INV-BASE", quantity: 250 },
      { productCode: "PROD-GRAN", inventoryCode: "INV-VASO", quantity: 1 },
    ],
  };
}

describe("CatalogImportService", () => {
  it("creates the full catalog from scratch", async () => {
    const { store, service } = createHarness();
    const result = await service.import(sampleDto());

    expect(result.categories.created).toBe(1);
    expect(result.inventory.created).toBe(2);
    expect(result.products.created).toBe(2);
    expect(store.categories.size).toBe(1);
    expect(store.inventory.size).toBe(2);
    expect(store.products.size).toBe(2);

    const gran = [...store.products.values()].find((p) => p.code === "PROD-GRAN");
    expect(gran?.fulfillmentType).toBe("compound");
    expect(gran?.recipe).toHaveLength(2);
    expect(gran?.priceCents).toBe(pesosToCents(80));
  });

  it("updates categories on second import", async () => {
    const { store, service } = createHarness();
    await service.import(sampleDto());
    const dto = sampleDto();
    dto.categories[0]!.name = "Bebidas frías";
    const result = await service.import(dto);
    expect(result.categories.updated).toBe(1);
    expect([...store.categories.values()][0]?.name).toBe("Bebidas frías");
  });

  it("updates inventory metadata and stock when actualizar_stock", async () => {
    const { store, service } = createHarness();
    await service.import(sampleDto());
    const dto = sampleDto();
    dto.inventory[0]!.name = "Vaso 12oz";
    dto.inventory[0]!.updateStock = true;
    dto.inventory[0]!.stockQuantity = 40;
    await service.import(dto);
    const vaso = [...store.inventory.values()].find((i) => i.code === "INV-VASO");
    expect(vaso?.name).toBe("Vaso 12oz");
    expect(vaso?.stockQuantity).toBe(40);
  });

  it("updates simple products", async () => {
    const { store, service } = createHarness();
    await service.import(sampleDto());
    const dto = sampleDto();
    dto.products[0]!.name = "Agua 600ml";
    dto.products[0]!.pricePesos = 30;
    await service.import(dto);
    const agua = [...store.products.values()].find((p) => p.code === "PROD-AGUA");
    expect(agua?.name).toBe("Agua 600ml");
    expect(agua?.priceCents).toBe(pesosToCents(30));
    expect(agua?.fulfillmentType).toBe("simple");
  });

  it("replaces compound recipes completely", async () => {
    const { store, service } = createHarness();
    await service.import(sampleDto());
    const dto = sampleDto();
    dto.recipes = [
      { productCode: "PROD-GRAN", inventoryCode: "INV-BASE", quantity: 300 },
    ];
    await service.import(dto);
    const gran = [...store.products.values()].find((p) => p.code === "PROD-GRAN");
    expect(gran?.recipe).toHaveLength(1);
    expect(gran?.recipe[0]?.quantity).toBe(300);
  });

  it("rolls back the whole import when a later step fails", async () => {
    const { store, service } = createHarness({ failOnProductCode: "PROD-AGUA" });
    await expect(service.import(sampleDto())).rejects.toThrow(/UNIQUE/);
    expect(store.categories.size).toBe(0);
    expect(store.inventory.size).toBe(0);
    expect(store.products.size).toBe(0);
  });

  it("is idempotent when importing the same workbook twice", async () => {
    const { store, service } = createHarness();
    const dto = sampleDto();
    await service.import(dto);
    const first = cloneStore(store);
    const secondResult = await service.import(dto);
    expect(secondResult.categories.updated).toBe(1);
    expect(secondResult.inventory.updated).toBe(2);
    expect(secondResult.products.updated).toBe(2);

    expect([...store.categories.values()].map((c) => c.name)).toEqual(
      [...first.categories.values()].map((c) => c.name),
    );
    expect(
      [...store.products.values()].map((p) => ({
        code: p.code,
        name: p.name,
        priceCents: p.priceCents,
        recipe: p.recipe.map((r) => ({
          ingredientId: r.ingredientId,
          quantity: r.quantity,
        })),
      })),
    ).toEqual(
      [...first.products.values()].map((p) => ({
        code: p.code,
        name: p.name,
        priceCents: p.priceCents,
        recipe: p.recipe.map((r) => ({
          ingredientId: r.ingredientId,
          quantity: r.quantity,
        })),
      })),
    );
  });

  it("rejects invalid dto before writing", async () => {
    const { store, service } = createHarness();
    const dto = sampleDto();
    dto.products[0]!.categoryCode = "CAT-MISSING";
    await expect(service.import(dto)).rejects.toThrow(/validación/i);
    expect(store.categories.size).toBe(0);
  });
});
