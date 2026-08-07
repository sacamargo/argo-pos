import type { CategoryService } from "@/application/services/category-service";
import type { InventoryService } from "@/application/services/inventory-service";
import type { ProductService } from "@/application/services/product-service";
import type {
  CatalogWorkbookDto,
  CatalogWorkbookProductDto,
  CatalogWorkbookRecipeDto,
} from "@/domain/catalog/catalog-workbook-dto";
import type { TransactionRunner } from "@/domain/repositories/transaction-runner";
import { pesosToCents } from "@/shared/utils/money";

export type CatalogImportValidator = {
  validate: (dto: CatalogWorkbookDto) => {
    valid: boolean;
    errors: Array<{
      sheet: string;
      row: number;
      column: string | null;
      code: string;
      message: string;
    }>;
  };
};

export type CatalogImportResult = {
  categories: { created: number; updated: number };
  inventory: { created: number; updated: number };
  products: { created: number; updated: number };
};

/**
 * Applies a validated catalog workbook DTO through existing application services.
 * Does not know ExcelJS; upserts by business `code` inside one transaction.
 */
export class CatalogImportService {
  constructor(
    private readonly categories: CategoryService,
    private readonly inventory: InventoryService,
    private readonly products: ProductService,
    private readonly validator: CatalogImportValidator,
    private readonly runInTransaction: TransactionRunner,
  ) {}

  /** Validate then apply. Rejects before any write if validation fails. */
  async import(dto: CatalogWorkbookDto): Promise<CatalogImportResult> {
    const report = this.validator.validate(dto);
    if (!report.valid) {
      const details = report.errors
        .map((error) => `${error.sheet} fila ${error.row}: ${error.message}`)
        .join(" | ");
      throw new Error(`Importación rechazada por validación. ${details}`);
    }
    return this.apply(dto);
  }

  /** Persist DTO (assumes validation already passed). */
  async apply(dto: CatalogWorkbookDto): Promise<CatalogImportResult> {
    return this.runInTransaction(async () => this.applyWithinTransaction(dto));
  }

  private async applyWithinTransaction(
    dto: CatalogWorkbookDto,
  ): Promise<CatalogImportResult> {
    const result: CatalogImportResult = {
      categories: { created: 0, updated: 0 },
      inventory: { created: 0, updated: 0 },
      products: { created: 0, updated: 0 },
    };

    const categoryIdByCode = new Map<string, string>();
    const inventoryIdByCode = new Map<string, string>();

    // 1. Categories
    for (const row of dto.categories) {
      const code = row.code.trim();
      const existing = await this.categories.findByCode(code);
      if (existing) {
        await this.categories.update({
          id: existing.id,
          name: row.name.trim(),
          sortOrder: row.sortOrder,
        });
        if (existing.active !== row.active) {
          await this.categories.setActive({ id: existing.id, active: row.active });
        }
        categoryIdByCode.set(code.toUpperCase(), existing.id);
        result.categories.updated += 1;
      } else {
        const created = await this.categories.create({
          code,
          name: row.name.trim(),
          sortOrder: row.sortOrder,
        });
        if (!row.active) {
          await this.categories.setActive({ id: created.id, active: false });
        }
        categoryIdByCode.set(code.toUpperCase(), created.id);
        result.categories.created += 1;
      }
    }

    // 2. Inventory
    for (const row of dto.inventory) {
      const code = row.code.trim();
      const existing = await this.inventory.findByCode(code);
      if (existing) {
        await this.inventory.updateIngredient({
          id: existing.id,
          name: row.name.trim(),
          unit: row.unit.trim(),
          minStock: row.minStock,
        });
        if (row.updateStock && row.stockQuantity !== null) {
          const delta = row.stockQuantity - existing.stockQuantity;
          if (delta !== 0) {
            await this.inventory.recordAdjustment({
              ingredientId: existing.id,
              quantity: delta,
              note: "Importación Excel (actualizar_stock)",
            });
          }
        }
        inventoryIdByCode.set(code.toUpperCase(), existing.id);
        result.inventory.updated += 1;
      } else {
        const created = await this.inventory.createIngredient({
          code,
          name: row.name.trim(),
          unit: row.unit.trim(),
          minStock: row.minStock,
          initialStock:
            row.stockQuantity !== null && row.stockQuantity > 0
              ? row.stockQuantity
              : undefined,
        });
        inventoryIdByCode.set(code.toUpperCase(), created.id);
        result.inventory.created += 1;
      }
    }

    const recipesByProduct = groupRecipesByProduct(dto.recipes);

    // 3–4. Products + full recipe replace for compound (from sheet Recetas)
    for (const row of dto.products) {
      const code = row.code.trim();
      const resolvedCategoryId = await this.resolveCategoryId(
        row.categoryCode,
        categoryIdByCode,
      );
      const priceCents = pesosToCents(row.pricePesos);
      if (!Number.isInteger(priceCents) || priceCents <= 0) {
        throw new Error(
          `Precio inválido para producto "${code}": ${row.pricePesos} (debe ser > 0).`,
        );
      }

      const payload = await this.buildProductPayload(
        row,
        resolvedCategoryId,
        inventoryIdByCode,
        recipesByProduct.get(code.toUpperCase()) ?? [],
      );

      const existing = await this.products.findByCode(code);
      if (existing) {
        await this.products.update({ id: existing.id, ...payload });
        if (existing.active !== row.active) {
          await this.products.setActive({ id: existing.id, active: row.active });
        }
        result.products.updated += 1;
      } else {
        const created = await this.products.create({ code, ...payload });
        if (!row.active) {
          await this.products.setActive({ id: created.id, active: false });
        }
        result.products.created += 1;
      }
    }

    return result;
  }

  private async resolveCategoryId(
    code: string,
    categoryIdByCode: Map<string, string>,
  ): Promise<string> {
    const key = code.trim().toUpperCase();
    const cached = categoryIdByCode.get(key);
    if (cached) {
      return cached;
    }
    const found = await this.categories.findByCode(code.trim());
    if (!found) {
      throw new Error(`Referencia inválida: categoría "${code}" no existe.`);
    }
    categoryIdByCode.set(key, found.id);
    return found.id;
  }

  private async buildProductPayload(
    row: CatalogWorkbookProductDto,
    categoryId: string,
    inventoryIdByCode: Map<string, string>,
    recipeRows: CatalogWorkbookRecipeDto[],
  ) {
    const fulfillmentType = String(row.fulfillmentType).trim().toLowerCase();

    if (fulfillmentType === "simple") {
      if (!row.inventoryCode) {
        throw new Error(
          `Producto simple "${row.code}" sin inventario_codigo al aplicar.`,
        );
      }
      const stockItemId = await this.resolveInventoryId(
        row.inventoryCode,
        inventoryIdByCode,
      );
      if (row.qtyPerSale === null || row.qtyPerSale <= 0) {
        throw new Error(
          `Producto simple "${row.code}" con cantidad_por_venta inválida.`,
        );
      }
      return {
        name: row.name.trim(),
        categoryId,
        priceCents: pesosToCents(row.pricePesos),
        fulfillmentType: "simple" as const,
        stockItemId,
        qtyPerSale: row.qtyPerSale,
        recipe: [] as Array<{ ingredientId: string; quantity: number }>,
      };
    }

    if (fulfillmentType === "compound") {
      if (recipeRows.length === 0) {
        throw new Error(
          `Producto compound "${row.code}" sin filas de receta en la hoja Recetas.`,
        );
      }
      const recipe: Array<{ ingredientId: string; quantity: number }> = [];
      for (const item of recipeRows) {
        const ingredientId = await this.resolveInventoryId(
          item.inventoryCode,
          inventoryIdByCode,
        );
        recipe.push({ ingredientId, quantity: item.quantity });
      }
      return {
        name: row.name.trim(),
        categoryId,
        priceCents: pesosToCents(row.pricePesos),
        fulfillmentType: "compound" as const,
        stockItemId: null,
        qtyPerSale: null,
        recipe,
      };
    }

    throw new Error(
      `Tipo de producto no soportado al aplicar: "${row.fulfillmentType}" (${row.code}).`,
    );
  }

  private async resolveInventoryId(
    code: string,
    inventoryIdByCode: Map<string, string>,
  ): Promise<string> {
    const key = code.trim().toUpperCase();
    const cached = inventoryIdByCode.get(key);
    if (cached) {
      return cached;
    }
    const found = await this.inventory.findByCode(code.trim());
    if (!found) {
      throw new Error(`Referencia inválida: inventario "${code}" no existe.`);
    }
    inventoryIdByCode.set(key, found.id);
    return found.id;
  }
}

function groupRecipesByProduct(
  recipes: CatalogWorkbookRecipeDto[],
): Map<string, CatalogWorkbookRecipeDto[]> {
  const map = new Map<string, CatalogWorkbookRecipeDto[]>();
  for (const row of recipes) {
    const key = row.productCode.trim().toUpperCase();
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  }
  return map;
}
