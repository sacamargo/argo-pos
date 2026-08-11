import {
  CATALOG_WORKBOOK_SHEETS,
  type CatalogWorkbookDto,
} from "@/domain/catalog/catalog-workbook-dto";
import { parseFulfillmentTypeFromExcel } from "@/infrastructure/excel/fulfillment-type-excel";

export type ValidationError = {
  sheet: string;
  row: number;
  column: string | null;
  code: string;
  message: string;
};

export type ValidationWarning = {
  sheet: string;
  row: number;
  column: string | null;
  code: string;
  message: string;
};

export type ValidationReport = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    categories: number;
    inventory: number;
    products: number;
    recipes: number;
  };
};

/** Excel data row ≈ DTO index + 2 (header is row 1). */
function excelRow(index: number): number {
  return index + 2;
}

function isBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === "";
}

function isNonNegativeNumber(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isPositiveNumber(value: number): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Business-rule validation over an already-parsed CatalogWorkbookDto.
 * Does not touch DB, repos, or CatalogService.
 */
export class CatalogWorkbookValidator {
  validate(dto: CatalogWorkbookDto): ValidationReport {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const categoryCodes = this.validateCategories(dto, errors);
    const inventoryCodes = this.validateInventory(dto, errors);
    const productCodes = this.validateProducts(dto, errors, categoryCodes, inventoryCodes);
    this.validateRecipes(dto, errors, productCodes, inventoryCodes);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        categories: dto.categories.length,
        inventory: dto.inventory.length,
        products: dto.products.length,
        recipes: dto.recipes.length,
      },
    };
  }

  private pushError(
    errors: ValidationError[],
    sheet: string,
    row: number,
    column: string | null,
    code: string,
    message: string,
  ): void {
    errors.push({ sheet, row, column, code, message });
  }

  private validateCategories(
    dto: CatalogWorkbookDto,
    errors: ValidationError[],
  ): Set<string> {
    const sheet = CATALOG_WORKBOOK_SHEETS.categories;
    const seen = new Map<string, number>();
    const codes = new Set<string>();

    dto.categories.forEach((row, index) => {
      const rowNumber = excelRow(index);

      if (isBlank(row.code)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "codigo",
          "CATEGORY_CODE_REQUIRED",
          "El código es obligatorio.",
        );
      } else {
        const normalized = row.code.trim().toUpperCase();
        const previous = seen.get(normalized);
        if (previous !== undefined) {
          this.pushError(
            errors,
            sheet,
            rowNumber,
            "codigo",
            "CATEGORY_CODE_DUPLICATE",
            `Código duplicado "${row.code.trim()}" (también en fila ${previous}).`,
          );
        } else {
          seen.set(normalized, rowNumber);
          codes.add(normalized);
        }
      }

      if (isBlank(row.name)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "nombre",
          "CATEGORY_NAME_REQUIRED",
          "El nombre es obligatorio.",
        );
      }
    });

    return codes;
  }

  private validateInventory(
    dto: CatalogWorkbookDto,
    errors: ValidationError[],
  ): Set<string> {
    const sheet = CATALOG_WORKBOOK_SHEETS.inventory;
    const seen = new Map<string, number>();
    const codes = new Set<string>();

    dto.inventory.forEach((row, index) => {
      const rowNumber = excelRow(index);

      if (isBlank(row.code)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "codigo",
          "INVENTORY_CODE_REQUIRED",
          "El código es obligatorio.",
        );
      } else {
        const normalized = row.code.trim().toUpperCase();
        const previous = seen.get(normalized);
        if (previous !== undefined) {
          this.pushError(
            errors,
            sheet,
            rowNumber,
            "codigo",
            "INVENTORY_CODE_DUPLICATE",
            `Código duplicado "${row.code.trim()}" (también en fila ${previous}).`,
          );
        } else {
          seen.set(normalized, rowNumber);
          codes.add(normalized);
        }
      }

      if (isBlank(row.name)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "nombre",
          "INVENTORY_NAME_REQUIRED",
          "El nombre es obligatorio.",
        );
      }

      if (isBlank(row.unit)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "unidad",
          "INVENTORY_UNIT_REQUIRED",
          "La unidad es obligatoria.",
        );
      }

      if (row.stockQuantity !== null && !isNonNegativeNumber(row.stockQuantity)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "stock",
          "INVENTORY_STOCK_INVALID",
          "El stock debe ser mayor o igual a 0.",
        );
      }

      if (!isNonNegativeNumber(row.minStock)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "stock_minimo",
          "INVENTORY_MIN_STOCK_INVALID",
          "El stock mínimo debe ser mayor o igual a 0.",
        );
      }
    });

    return codes;
  }

  private validateProducts(
    dto: CatalogWorkbookDto,
    errors: ValidationError[],
    categoryCodes: Set<string>,
    inventoryCodes: Set<string>,
  ): Set<string> {
    const sheet = CATALOG_WORKBOOK_SHEETS.products;
    const seen = new Map<string, number>();
    const codes = new Set<string>();

    dto.products.forEach((row, index) => {
      const rowNumber = excelRow(index);

      if (isBlank(row.code)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "codigo",
          "PRODUCT_CODE_REQUIRED",
          "El código es obligatorio.",
        );
      } else {
        const normalized = row.code.trim().toUpperCase();
        const previous = seen.get(normalized);
        if (previous !== undefined) {
          this.pushError(
            errors,
            sheet,
            rowNumber,
            "codigo",
            "PRODUCT_CODE_DUPLICATE",
            `Código duplicado "${row.code.trim()}" (también en fila ${previous}).`,
          );
        } else {
          seen.set(normalized, rowNumber);
          codes.add(normalized);
        }
      }

      if (isBlank(row.name)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "nombre",
          "PRODUCT_NAME_REQUIRED",
          "El nombre es obligatorio.",
        );
      }

      if (isBlank(row.categoryCode)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "categoria_codigo",
          "PRODUCT_CATEGORY_REQUIRED",
          "La categoría es obligatoria.",
        );
      } else if (!categoryCodes.has(row.categoryCode.trim().toUpperCase())) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "categoria_codigo",
          "PRODUCT_CATEGORY_MISSING",
          `Categoría "${row.categoryCode.trim()}" no existe.`,
        );
      }

      if (!isNonNegativeNumber(row.pricePesos)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "precio",
          "PRODUCT_PRICE_INVALID",
          "El precio debe ser mayor o igual a 0.",
        );
      }

      if (row.costPesos !== null && !isNonNegativeNumber(row.costPesos)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "costo",
          "PRODUCT_COST_INVALID",
          "El costo debe estar vacío o ser mayor o igual a 0.",
        );
      }

      const tipo = parseFulfillmentTypeFromExcel(String(row.fulfillmentType ?? "").trim());
      if (!tipo) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "tipo",
          "PRODUCT_TYPE_INVALID",
          'El tipo debe ser "Simple" o "Compuesto".',
        );
        return;
      }

      if (tipo === "simple") {
        if (isBlank(row.inventoryCode)) {
          this.pushError(
            errors,
            sheet,
            rowNumber,
            "inventario_codigo",
            "PRODUCT_SIMPLE_INVENTORY_REQUIRED",
            'Un producto "Simple" requiere inventario_codigo.',
          );
        } else if (!inventoryCodes.has(row.inventoryCode!.trim().toUpperCase())) {
          this.pushError(
            errors,
            sheet,
            rowNumber,
            "inventario_codigo",
            "PRODUCT_INVENTORY_MISSING",
            `Inventario "${row.inventoryCode!.trim()}" no existe.`,
          );
        }

        if (row.qtyPerSale === null || !isPositiveNumber(row.qtyPerSale)) {
          this.pushError(
            errors,
            sheet,
            rowNumber,
            "cantidad_por_venta",
            "PRODUCT_SIMPLE_QTY_INVALID",
            "cantidad_por_venta debe ser mayor a 0.",
          );
        }
      }

      if (tipo === "compound") {
        if (!isBlank(row.inventoryCode)) {
          this.pushError(
            errors,
            sheet,
            rowNumber,
            "inventario_codigo",
            "PRODUCT_COMPOUND_INVENTORY_FORBIDDEN",
            'Un producto "Compuesto" no debe tener inventario_codigo.',
          );
        }
        if (row.qtyPerSale !== null) {
          this.pushError(
            errors,
            sheet,
            rowNumber,
            "cantidad_por_venta",
            "PRODUCT_COMPOUND_QTY_FORBIDDEN",
            'Un producto "Compuesto" no debe tener cantidad_por_venta.',
          );
        }
      }
    });

    return codes;
  }

  private validateRecipes(
    dto: CatalogWorkbookDto,
    errors: ValidationError[],
    productCodes: Set<string>,
    inventoryCodes: Set<string>,
  ): void {
    const sheet = CATALOG_WORKBOOK_SHEETS.recipes;
    const seen = new Map<string, number>();

    dto.recipes.forEach((row, index) => {
      const rowNumber = excelRow(index);

      if (isBlank(row.productCode)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "producto_codigo",
          "RECIPE_PRODUCT_REQUIRED",
          "producto_codigo es obligatorio.",
        );
      } else if (!productCodes.has(row.productCode.trim().toUpperCase())) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "producto_codigo",
          "RECIPE_PRODUCT_MISSING",
          `Producto "${row.productCode.trim()}" no existe.`,
        );
      }

      if (isBlank(row.inventoryCode)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "inventario_codigo",
          "RECIPE_INVENTORY_REQUIRED",
          "inventario_codigo es obligatorio.",
        );
      } else if (!inventoryCodes.has(row.inventoryCode.trim().toUpperCase())) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "inventario_codigo",
          "RECIPE_INVENTORY_MISSING",
          `Inventario "${row.inventoryCode.trim()}" no existe.`,
        );
      }

      if (!isPositiveNumber(row.quantity)) {
        this.pushError(
          errors,
          sheet,
          rowNumber,
          "cantidad",
          "RECIPE_QUANTITY_INVALID",
          "La cantidad debe ser mayor a 0.",
        );
      }

      if (!isBlank(row.productCode) && !isBlank(row.inventoryCode)) {
        const key = `${row.productCode.trim().toUpperCase()}|${row.inventoryCode.trim().toUpperCase()}`;
        const previous = seen.get(key);
        if (previous !== undefined) {
          this.pushError(
            errors,
            sheet,
            rowNumber,
            "inventario_codigo",
            "RECIPE_DUPLICATE",
            `Receta duplicada para producto "${row.productCode.trim()}" e inventario "${row.inventoryCode.trim()}" (también en fila ${previous}).`,
          );
        } else {
          seen.set(key, rowNumber);
        }
      }
    });
  }
}
