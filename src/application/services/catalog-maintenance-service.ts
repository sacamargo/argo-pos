import type { CategoryService } from "@/application/services/category-service";
import type { InventoryService } from "@/application/services/inventory-service";
import type { ProductService } from "@/application/services/product-service";
import type { CategoryRepository } from "@/domain/repositories/category-repository";
import type { IngredientRepository } from "@/domain/repositories/ingredient-repository";
import type { InventoryMovementRepository } from "@/domain/repositories/inventory-movement-repository";
import type { ProductRepository } from "@/domain/repositories/product-repository";
import type { SaleRepository } from "@/domain/repositories/sale-repository";
import type { TransactionRunner } from "@/domain/repositories/transaction-runner";

export type CatalogWipeResult = {
  recipesDeleted: number;
  productsDeleted: number;
  productsDeactivated: number;
  ingredientsDeleted: number;
  ingredientsDeactivated: number;
  categoriesDeleted: number;
  categoriesDeactivated: number;
};

/**
 * Administrative maintenance for client delivery / reset of business catalog data.
 *
 * Separate from CatalogService (which owns Excel + catalog facade).
 * Does not touch users, sales, cash sessions, settings, or payment methods.
 */
export class CatalogMaintenanceService {
  constructor(
    private readonly productService: ProductService,
    private readonly inventoryService: InventoryService,
    private readonly categoryService: CategoryService,
    /**
     * Direct repo: ProductService has no wipe/delete API; recipes must clear before products.
     */
    private readonly products: ProductRepository,
    /**
     * Direct repo: hard-delete when FKs allow; InventoryService only updates/activates today.
     */
    private readonly ingredients: IngredientRepository,
    /**
     * Direct repo: hard-delete unused categories after products are resolved.
     */
    private readonly categories: CategoryRepository,
    /**
     * Direct repo: sale_items FK check — never delete products that appear in sales history.
     */
    private readonly sales: SaleRepository,
    /**
     * Direct repo: movements FK — keep ingredient (+ movements) when history exists.
     */
    private readonly movements: InventoryMovementRepository,
    private readonly runInTransaction: TransactionRunner,
  ) {}

  async wipeCatalogAndInventory(): Promise<CatalogWipeResult> {
    return this.runInTransaction(async () => {
      const result: CatalogWipeResult = {
        recipesDeleted: 0,
        productsDeleted: 0,
        productsDeactivated: 0,
        ingredientsDeleted: 0,
        ingredientsDeactivated: 0,
        categoriesDeleted: 0,
        categoriesDeactivated: 0,
      };

      result.recipesDeleted = await this.products.deleteAllRecipeItems();

      const productRows = await this.productService.listAll();
      for (const product of productRows) {
        const referenced = await this.sales.isProductReferenced(product.id);
        if (referenced) {
          if (product.active) {
            await this.productService.setActive({ id: product.id, active: false });
            result.productsDeactivated += 1;
          }
        } else {
          await this.products.deleteById(product.id);
          result.productsDeleted += 1;
        }
      }

      const remainingProducts = await this.productService.listAll();
      const linkedIngredientIds = new Set(
        remainingProducts
          .map((product) => product.stockItemId)
          .filter((id): id is string => Boolean(id)),
      );

      const ingredientRows = await this.inventoryService.listIngredients();
      for (const ingredient of ingredientRows) {
        const linkedToProduct = linkedIngredientIds.has(ingredient.id);
        const hasMovements = await this.movements.hasMovementsForIngredient(ingredient.id);
        if (linkedToProduct || hasMovements) {
          if (ingredient.active) {
            await this.ingredients.setActive(ingredient.id, false);
            result.ingredientsDeactivated += 1;
          }
        } else {
          await this.ingredients.deleteById(ingredient.id);
          result.ingredientsDeleted += 1;
        }
      }

      const linkedCategoryIds = new Set(
        remainingProducts
          .map((product) => product.categoryId)
          .filter((id): id is string => Boolean(id)),
      );

      const categoryRows = await this.categoryService.listAll();
      for (const category of categoryRows) {
        if (linkedCategoryIds.has(category.id)) {
          if (category.active) {
            await this.categoryService.setActive({ id: category.id, active: false });
            result.categoriesDeactivated += 1;
          }
        } else {
          await this.categories.deleteById(category.id);
          result.categoriesDeleted += 1;
        }
      }

      return result;
    });
  }
}
