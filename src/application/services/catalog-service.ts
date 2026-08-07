import type { CategoryService } from "@/application/services/category-service";
import type { InventoryService } from "@/application/services/inventory-service";
import type { ProductService } from "@/application/services/product-service";
import type { CatalogSnapshot } from "@/application/catalog/catalog-snapshot";
import type { Category } from "@/domain/entities/category";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { Product, ProductWithRecipe } from "@/domain/entities/product";

/**
 * Application facade for the business catalog (categories + inventory + products/recipes).
 *
 * - UI CRUD keeps using CategoryService / InventoryService / ProductService directly.
 * - Future Excel import/export must talk only to CatalogService (not to child services).
 *
 * Does not replace specialized services; it orchestrates them.
 */
export class CatalogService {
  constructor(
    private readonly categories: CategoryService,
    private readonly inventory: InventoryService,
    private readonly products: ProductService,
  ) {}

  /** Read-only aggregate for export / dry-run baselines. */
  async getCatalogSnapshot(): Promise<CatalogSnapshot> {
    const [categoryRows, inventoryRows, productRows] = await Promise.all([
      this.categories.listAll(),
      this.inventory.listIngredients(),
      this.products.listAll(),
    ]);

    const productsWithRecipe: ProductWithRecipe[] = [];
    for (const product of productRows) {
      const detail = await this.products.getById(product.id);
      if (detail) {
        productsWithRecipe.push(detail);
      }
    }

    return {
      categories: categoryRows,
      inventory: inventoryRows,
      products: productsWithRecipe,
    };
  }

  async listCategories(): Promise<Category[]> {
    return this.categories.listAll();
  }

  async listInventory(): Promise<Ingredient[]> {
    return this.inventory.listIngredients();
  }

  async listProducts(): Promise<Product[]> {
    return this.products.listAll();
  }

  async findCategoryByCode(code: string): Promise<Category | null> {
    return this.categories.findByCode(code);
  }

  async findInventoryByCode(code: string): Promise<Ingredient | null> {
    return this.inventory.findByCode(code);
  }

  async findProductByCode(code: string): Promise<ProductWithRecipe | null> {
    return this.products.findByCode(code);
  }

  /*
   * Future Excel phase (not implemented here):
   * - exportCatalog(): Promise<Uint8Array>
   * - validateCatalog(input): Promise<CatalogValidationReport>
   * - applyCatalog(input): Promise<CatalogApplyResult>
   * - importCatalog(bytes) = parse → validate → apply (orquestration only)
   *
   * Those methods will depend on a CatalogWorkbookCodec port in infrastructure,
   * and will call categories / inventory / products services for upserts.
   */
}
