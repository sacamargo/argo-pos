import { z } from "zod";
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
  ingredientsDeleted: number;
  categoriesDeleted: number;
  saleLinksDetached: number;
  movementsDeleted: number;
};

const idSchema = z.object({
  id: z.string().min(1),
});

/**
 * Administrative maintenance for client delivery / reset of business catalog data.
 *
 * Hard-deletes so rows disappear from lists. Sales keep name/price snapshots
 * (product_id is detached). Does not touch users, cash sessions, settings, or payment methods.
 */
export class CatalogMaintenanceService {
  constructor(
    private readonly productService: ProductService,
    private readonly inventoryService: InventoryService,
    private readonly categoryService: CategoryService,
    private readonly products: ProductRepository,
    private readonly ingredients: IngredientRepository,
    private readonly categories: CategoryRepository,
    private readonly sales: SaleRepository,
    private readonly movements: InventoryMovementRepository,
    private readonly runInTransaction: TransactionRunner,
  ) {}

  async wipeCatalogAndInventory(): Promise<CatalogWipeResult> {
    return this.runInTransaction(async () => {
      const result: CatalogWipeResult = {
        recipesDeleted: 0,
        productsDeleted: 0,
        ingredientsDeleted: 0,
        categoriesDeleted: 0,
        saleLinksDetached: 0,
        movementsDeleted: 0,
      };

      result.recipesDeleted = await this.products.deleteAllRecipeItems();

      const productRows = await this.productService.listAll();
      for (const product of productRows) {
        result.saleLinksDetached += await this.sales.detachProductReferences(product.id);
        await this.products.deleteById(product.id);
        result.productsDeleted += 1;
      }

      const ingredientRows = await this.inventoryService.listIngredients();
      for (const ingredient of ingredientRows) {
        result.movementsDeleted += await this.movements.deleteByIngredientId(ingredient.id);
        await this.ingredients.deleteById(ingredient.id);
        result.ingredientsDeleted += 1;
      }

      const categoryRows = await this.categoryService.listAll();
      for (const category of categoryRows) {
        await this.categories.deleteById(category.id);
        result.categoriesDeleted += 1;
      }

      return result;
    });
  }

  /** Hard-delete one product (detaches sale links; removes recipe). */
  async deleteProduct(raw: unknown): Promise<void> {
    const input = idSchema.parse(raw);
    await this.runInTransaction(async () => {
      const existing = await this.products.findByIdWithRecipe(input.id);
      if (!existing) {
        throw new Error("Producto no encontrado");
      }
      await this.products.deleteRecipeItemsByProductId(input.id);
      await this.sales.detachProductReferences(input.id);
      const stockItemId = existing.stockItemId;
      await this.products.deleteById(input.id);

      if (stockItemId) {
        const links = await this.products.findLinksToIngredient(stockItemId);
        if (!links.asStock && !links.inRecipe) {
          await this.movements.deleteByIngredientId(stockItemId);
          await this.ingredients.deleteById(stockItemId);
        }
      }
    });
  }

  /** Hard-delete one inventory item (blocked if still used by any product). */
  async deleteIngredient(raw: unknown): Promise<void> {
    const input = idSchema.parse(raw);
    await this.runInTransaction(async () => {
      const existing = await this.ingredients.findById(input.id);
      if (!existing) {
        throw new Error("Ítem de inventario no encontrado");
      }
      const links = await this.products.findLinksToIngredient(input.id);
      if (links.asStock || links.inRecipe) {
        throw new Error(
          "No se puede eliminar: está ligado a un producto en Catálogo. Elimina o edita ese producto primero.",
        );
      }
      await this.movements.deleteByIngredientId(input.id);
      await this.ingredients.deleteById(input.id);
    });
  }

  /** Hard-delete one category (blocked if any product still uses it). */
  async deleteCategory(raw: unknown): Promise<void> {
    const input = idSchema.parse(raw);
    await this.runInTransaction(async () => {
      const existing = await this.categories.findById(input.id);
      if (!existing) {
        throw new Error("Categoría no encontrada");
      }
      const products = await this.productService.listAll();
      if (products.some((product) => product.categoryId === input.id)) {
        throw new Error(
          "No se puede eliminar: hay productos en esta categoría. Elimínalos primero.",
        );
      }
      await this.categories.deleteById(input.id);
    });
  }
}
