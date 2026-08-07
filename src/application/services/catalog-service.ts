import type { CatalogImportService } from "@/application/services/catalog-import-service";
import type { CatalogImportValidator } from "@/application/services/catalog-import-service";
import type { CatalogImportResult } from "@/application/services/catalog-import-service";
import type { CategoryService } from "@/application/services/category-service";
import type { InventoryService } from "@/application/services/inventory-service";
import type { ProductService } from "@/application/services/product-service";
import { snapshotToWorkbookDto } from "@/application/catalog/snapshot-to-workbook-dto";
import type { CatalogSnapshot } from "@/application/catalog/catalog-snapshot";
import type { CatalogWorkbookCodec } from "@/domain/catalog/catalog-workbook-codec";
import type { Category } from "@/domain/entities/category";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { Product, ProductWithRecipe } from "@/domain/entities/product";

export type CatalogImportPreview = {
  valid: boolean;
  errors: Array<{
    sheet: string;
    row: number;
    column: string | null;
    code: string;
    message: string;
  }>;
  summary: {
    categories: number;
    inventory: number;
    products: number;
    recipes: number;
  };
};

/**
 * Application facade for the business catalog (categories + inventory + products/recipes).
 *
 * - UI CRUD keeps using CategoryService / InventoryService / ProductService directly.
 * - Excel import/export talks only to CatalogService (not to exceljs or child services).
 */
export class CatalogService {
  constructor(
    private readonly categories: CategoryService,
    private readonly inventory: InventoryService,
    private readonly products: ProductService,
    private readonly workbook: CatalogWorkbookCodec,
    private readonly catalogImport: CatalogImportService,
    private readonly validator: CatalogImportValidator,
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

  /** Official empty template workbook bytes. */
  async buildTemplateWorkbook(): Promise<Uint8Array> {
    return this.workbook.buildTemplate();
  }

  /** Export current catalog as workbook bytes. */
  async exportCatalogWorkbook(): Promise<Uint8Array> {
    const snapshot = await this.getCatalogSnapshot();
    const dto = snapshotToWorkbookDto(snapshot);
    return this.workbook.buildExport(dto);
  }

  /** Parse + validate without writing (dry-run). */
  async previewImport(bytes: Uint8Array): Promise<CatalogImportPreview> {
    const dto = await this.workbook.parse(bytes);
    const report = this.validator.validate(dto);
    return {
      valid: report.valid,
      errors: report.errors,
      summary: {
        categories: dto.categories.length,
        inventory: dto.inventory.length,
        products: dto.products.length,
        recipes: dto.recipes.length,
      },
    };
  }

  /** Parse → validate → apply. */
  async importCatalogWorkbook(bytes: Uint8Array): Promise<CatalogImportResult> {
    const dto = await this.workbook.parse(bytes);
    return this.catalogImport.import(dto);
  }
}
