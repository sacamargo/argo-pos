import { describe, expect, it, vi } from "vitest";
import { CatalogMaintenanceService } from "@/application/services/catalog-maintenance-service";
import type { CategoryService } from "@/application/services/category-service";
import type { InventoryService } from "@/application/services/inventory-service";
import type { ProductService } from "@/application/services/product-service";
import type { Category } from "@/domain/entities/category";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { Product, ProductRecipeItem } from "@/domain/entities/product";
import type { CategoryRepository } from "@/domain/repositories/category-repository";
import type { IngredientRepository } from "@/domain/repositories/ingredient-repository";
import type { InventoryMovementRepository } from "@/domain/repositories/inventory-movement-repository";
import type { ProductRepository } from "@/domain/repositories/product-repository";
import type { SaleRepository } from "@/domain/repositories/sale-repository";
import type { TransactionRunner } from "@/domain/repositories/transaction-runner";

type Store = {
  categories: Map<string, Category>;
  ingredients: Map<string, Ingredient>;
  products: Map<string, Product>;
  recipes: ProductRecipeItem[];
  referencedProductIds: Set<string>;
  ingredientIdsWithMovements: Set<string>;
};

function emptyStore(): Store {
  return {
    categories: new Map(),
    ingredients: new Map(),
    products: new Map(),
    recipes: [],
    referencedProductIds: new Set(),
    ingredientIdsWithMovements: new Set(),
  };
}

function createHarness(store: Store) {
  const runInTransaction: TransactionRunner = async (work) => work();

  const productService = {
    listAll: vi.fn(async () => [...store.products.values()]),
    setActive: vi.fn(async (raw: { id: string; active: boolean }) => {
      const row = store.products.get(raw.id);
      if (!row) {
        throw new Error("missing product");
      }
      const next = { ...row, active: raw.active };
      store.products.set(raw.id, next);
      return next;
    }),
  } as unknown as ProductService;

  const inventoryService = {
    listIngredients: vi.fn(async () => [...store.ingredients.values()]),
  } as unknown as InventoryService;

  const categoryService = {
    listAll: vi.fn(async () => [...store.categories.values()]),
    setActive: vi.fn(async (raw: { id: string; active: boolean }) => {
      const row = store.categories.get(raw.id);
      if (!row) {
        throw new Error("missing category");
      }
      const next = { ...row, active: raw.active };
      store.categories.set(raw.id, next);
      return next;
    }),
  } as unknown as CategoryService;

  const products = {
    deleteAllRecipeItems: vi.fn(async () => {
      const count = store.recipes.length;
      store.recipes = [];
      return count;
    }),
    deleteById: vi.fn(async (id: string) => {
      store.products.delete(id);
    }),
  } as unknown as ProductRepository;

  const ingredients = {
    setActive: vi.fn(async (id: string, active: boolean) => {
      const row = store.ingredients.get(id);
      if (!row) {
        throw new Error("missing ingredient");
      }
      const next = { ...row, active };
      store.ingredients.set(id, next);
      return next;
    }),
    deleteById: vi.fn(async (id: string) => {
      store.ingredients.delete(id);
    }),
  } as unknown as IngredientRepository;

  const categories = {
    deleteById: vi.fn(async (id: string) => {
      store.categories.delete(id);
    }),
  } as unknown as CategoryRepository;

  const sales = {
    isProductReferenced: vi.fn(async (productId: string) =>
      store.referencedProductIds.has(productId),
    ),
  } as unknown as SaleRepository;

  const movements = {
    hasMovementsForIngredient: vi.fn(async (ingredientId: string) =>
      store.ingredientIdsWithMovements.has(ingredientId),
    ),
  } as unknown as InventoryMovementRepository;

  const service = new CatalogMaintenanceService(
    productService,
    inventoryService,
    categoryService,
    products,
    ingredients,
    categories,
    sales,
    movements,
    runInTransaction,
  );

  return { service, store, products, ingredients, categories, sales };
}

function category(id: string, name: string): Category {
  return { id, code: `CAT-${id}`, name, active: true, sortOrder: 1 };
}

function ingredient(id: string, name: string): Ingredient {
  return {
    id,
    code: `INV-${id}`,
    name,
    unit: "und",
    stockQuantity: 10,
    minStock: 1,
    active: true,
    createdAt: "t",
  };
}

function product(
  partial: Partial<Product> & Pick<Product, "id" | "name" | "fulfillmentType">,
): Product {
  return {
    code: `PROD-${partial.id}`,
    categoryId: null,
    imagePath: null,
    priceCents: 1000,
    stockItemId: null,
    qtyPerSale: null,
    active: true,
    createdAt: "t",
    updatedAt: "t",
    ...partial,
  };
}

describe("CatalogMaintenanceService.wipeCatalogAndInventory", () => {
  it("wipe vacío is a no-op with zero counters", async () => {
    const { service } = createHarness(emptyStore());
    const result = await service.wipeCatalogAndInventory();
    expect(result).toEqual({
      recipesDeleted: 0,
      productsDeleted: 0,
      productsDeactivated: 0,
      ingredientsDeleted: 0,
      ingredientsDeactivated: 0,
      categoriesDeleted: 0,
      categoriesDeactivated: 0,
    });
  });

  it("wipe con catálogo elimina categorías e inventario sin ventas", async () => {
    const store = emptyStore();
    store.categories.set("c1", category("c1", "Snacks"));
    store.ingredients.set("i1", ingredient("i1", "Doritos"));
    const { service } = createHarness(store);

    const result = await service.wipeCatalogAndInventory();

    expect(result.categoriesDeleted).toBe(1);
    expect(result.ingredientsDeleted).toBe(1);
    expect(store.categories.size).toBe(0);
    expect(store.ingredients.size).toBe(0);
  });

  it("wipe con productos simples elimina producto e inventario enlazado", async () => {
    const store = emptyStore();
    store.categories.set("c1", category("c1", "Snacks"));
    store.ingredients.set("i1", ingredient("i1", "Doritos"));
    store.products.set(
      "p1",
      product({
        id: "p1",
        name: "Doritos",
        fulfillmentType: "simple",
        categoryId: "c1",
        stockItemId: "i1",
        qtyPerSale: 1,
      }),
    );
    const { service } = createHarness(store);

    const result = await service.wipeCatalogAndInventory();

    expect(result.productsDeleted).toBe(1);
    expect(result.ingredientsDeleted).toBe(1);
    expect(result.categoriesDeleted).toBe(1);
    expect(store.products.size).toBe(0);
    expect(store.ingredients.size).toBe(0);
    expect(store.categories.size).toBe(0);
  });

  it("wipe con compuestos elimina recetas, producto e insumos", async () => {
    const store = emptyStore();
    store.categories.set("c1", category("c1", "Granizados"));
    store.ingredients.set("vaso", ingredient("vaso", "Vaso"));
    store.ingredients.set("base", ingredient("base", "Base"));
    store.products.set(
      "p1",
      product({
        id: "p1",
        name: "Granizado",
        fulfillmentType: "compound",
        categoryId: "c1",
      }),
    );
    store.recipes.push(
      { id: "r1", productId: "p1", ingredientId: "vaso", quantity: 1 },
      { id: "r2", productId: "p1", ingredientId: "base", quantity: 250 },
    );
    const { service } = createHarness(store);

    const result = await service.wipeCatalogAndInventory();

    expect(result.recipesDeleted).toBe(2);
    expect(result.productsDeleted).toBe(1);
    expect(result.ingredientsDeleted).toBe(2);
    expect(result.categoriesDeleted).toBe(1);
    expect(store.recipes).toEqual([]);
    expect(store.products.size).toBe(0);
  });

  it("wipe con ventas existentes desactiva producto y conserva FKs", async () => {
    const store = emptyStore();
    store.categories.set("c1", category("c1", "Snacks"));
    store.ingredients.set("i1", ingredient("i1", "Cerveza"));
    store.products.set(
      "p1",
      product({
        id: "p1",
        name: "Cerveza",
        fulfillmentType: "simple",
        categoryId: "c1",
        stockItemId: "i1",
        qtyPerSale: 1,
      }),
    );
    store.referencedProductIds.add("p1");
    store.ingredientIdsWithMovements.add("i1");
    const { service } = createHarness(store);

    const result = await service.wipeCatalogAndInventory();

    expect(result.productsDeleted).toBe(0);
    expect(result.productsDeactivated).toBe(1);
    expect(result.ingredientsDeleted).toBe(0);
    expect(result.ingredientsDeactivated).toBe(1);
    expect(result.categoriesDeleted).toBe(0);
    expect(result.categoriesDeactivated).toBe(1);
    expect(store.products.get("p1")?.active).toBe(false);
    expect(store.ingredients.get("i1")?.active).toBe(false);
    expect(store.categories.get("c1")?.active).toBe(false);
  });

  it("wipe es idempotente", async () => {
    const store = emptyStore();
    store.categories.set("c1", category("c1", "Snacks"));
    store.ingredients.set("i1", ingredient("i1", "Doritos"));
    store.products.set(
      "p1",
      product({
        id: "p1",
        name: "Doritos",
        fulfillmentType: "simple",
        categoryId: "c1",
        stockItemId: "i1",
        qtyPerSale: 1,
      }),
    );
    const { service } = createHarness(store);

    const first = await service.wipeCatalogAndInventory();
    const second = await service.wipeCatalogAndInventory();

    expect(first.productsDeleted).toBe(1);
    expect(second).toEqual({
      recipesDeleted: 0,
      productsDeleted: 0,
      productsDeactivated: 0,
      ingredientsDeleted: 0,
      ingredientsDeactivated: 0,
      categoriesDeleted: 0,
      categoriesDeactivated: 0,
    });
  });
});
