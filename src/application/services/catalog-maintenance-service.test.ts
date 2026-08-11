import { describe, expect, it, vi } from "vitest";
import { CatalogMaintenanceService } from "@/application/services/catalog-maintenance-service";
import type { CategoryService } from "@/application/services/category-service";
import type { InventoryService } from "@/application/services/inventory-service";
import type { ProductService } from "@/application/services/product-service";
import type { Category } from "@/domain/entities/category";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { Product, ProductRecipeItem, ProductWithRecipe } from "@/domain/entities/product";
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
  saleLinks: Map<string, number>;
  movementCounts: Map<string, number>;
};

function emptyStore(): Store {
  return {
    categories: new Map(),
    ingredients: new Map(),
    products: new Map(),
    recipes: [],
    saleLinks: new Map(),
    movementCounts: new Map(),
  };
}

function createHarness(store: Store) {
  const runInTransaction: TransactionRunner = async (work) => work();

  const productService = {
    listAll: vi.fn(async () => [...store.products.values()]),
  } as unknown as ProductService;

  const inventoryService = {
    listIngredients: vi.fn(async () => [...store.ingredients.values()]),
  } as unknown as InventoryService;

  const categoryService = {
    listAll: vi.fn(async () => [...store.categories.values()]),
  } as unknown as CategoryService;

  const products = {
    deleteAllRecipeItems: vi.fn(async () => {
      const count = store.recipes.length;
      store.recipes = [];
      return count;
    }),
    deleteRecipeItemsByProductId: vi.fn(async (productId: string) => {
      const before = store.recipes.length;
      store.recipes = store.recipes.filter((row) => row.productId !== productId);
      return before - store.recipes.length;
    }),
    deleteById: vi.fn(async (id: string) => {
      store.products.delete(id);
    }),
    findByIdWithRecipe: vi.fn(async (id: string) => {
      const row = store.products.get(id);
      if (!row) {
        return null;
      }
      return {
        ...row,
        recipe: store.recipes.filter((item) => item.productId === id),
      } satisfies ProductWithRecipe;
    }),
    findLinksToIngredient: vi.fn(async (ingredientId: string) => {
      const asStock = [...store.products.values()].some(
        (product) => product.stockItemId === ingredientId,
      );
      const inRecipe = store.recipes.some((row) => row.ingredientId === ingredientId);
      return { asStock, inRecipe };
    }),
  } as unknown as ProductRepository;

  const ingredients = {
    findById: vi.fn(async (id: string) => store.ingredients.get(id) ?? null),
    deleteById: vi.fn(async (id: string) => {
      store.ingredients.delete(id);
    }),
  } as unknown as IngredientRepository;

  const categories = {
    findById: vi.fn(async (id: string) => store.categories.get(id) ?? null),
    deleteById: vi.fn(async (id: string) => {
      store.categories.delete(id);
    }),
  } as unknown as CategoryRepository;

  const sales = {
    detachProductReferences: vi.fn(async (productId: string) => {
      const count = store.saleLinks.get(productId) ?? 0;
      store.saleLinks.delete(productId);
      return count;
    }),
  } as unknown as SaleRepository;

  const movements = {
    deleteByIngredientId: vi.fn(async (ingredientId: string) => {
      const count = store.movementCounts.get(ingredientId) ?? 0;
      store.movementCounts.delete(ingredientId);
      return count;
    }),
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

  return { service, store };
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
    costCents: null,
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
      ingredientsDeleted: 0,
      categoriesDeleted: 0,
      saleLinksDetached: 0,
      movementsDeleted: 0,
    });
  });

  it("wipe elimina catálogo e inventario aunque haya ventas/movimientos", async () => {
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
    store.saleLinks.set("p1", 3);
    store.movementCounts.set("i1", 5);
    const { service } = createHarness(store);

    const result = await service.wipeCatalogAndInventory();

    expect(result.productsDeleted).toBe(1);
    expect(result.ingredientsDeleted).toBe(1);
    expect(result.categoriesDeleted).toBe(1);
    expect(result.saleLinksDetached).toBe(3);
    expect(result.movementsDeleted).toBe(5);
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
      ingredientsDeleted: 0,
      categoriesDeleted: 0,
      saleLinksDetached: 0,
      movementsDeleted: 0,
    });
  });
});

describe("CatalogMaintenanceService.delete*", () => {
  it("deleteProduct elimina y limpia inventario huérfano", async () => {
    const store = emptyStore();
    store.ingredients.set("i1", ingredient("i1", "Doritos"));
    store.products.set(
      "p1",
      product({
        id: "p1",
        name: "Doritos",
        fulfillmentType: "simple",
        stockItemId: "i1",
        qtyPerSale: 1,
      }),
    );
    const { service } = createHarness(store);

    await service.deleteProduct({ id: "p1" });

    expect(store.products.size).toBe(0);
    expect(store.ingredients.size).toBe(0);
  });

  it("deleteIngredient falla si está ligado a un producto", async () => {
    const store = emptyStore();
    store.ingredients.set("i1", ingredient("i1", "Vaso"));
    store.products.set(
      "p1",
      product({ id: "p1", name: "Granizado", fulfillmentType: "compound" }),
    );
    store.recipes.push({
      id: "r1",
      productId: "p1",
      ingredientId: "i1",
      quantity: 1,
    });
    const { service } = createHarness(store);

    await expect(service.deleteIngredient({ id: "i1" })).rejects.toThrow(/ligado/);
    expect(store.ingredients.has("i1")).toBe(true);
  });

  it("deleteCategory falla si tiene productos", async () => {
    const store = emptyStore();
    store.categories.set("c1", category("c1", "Snacks"));
    store.products.set(
      "p1",
      product({
        id: "p1",
        name: "Doritos",
        fulfillmentType: "simple",
        categoryId: "c1",
      }),
    );
    const { service } = createHarness(store);

    await expect(service.deleteCategory({ id: "c1" })).rejects.toThrow(/productos/);
    expect(store.categories.has("c1")).toBe(true);
  });
});
