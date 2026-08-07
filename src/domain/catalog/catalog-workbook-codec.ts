import type { CatalogWorkbookDto } from "@/domain/catalog/catalog-workbook-dto";

/**
 * Port: encode/decode the catalog Excel workbook.
 *
 * Application services depend on this interface only — never on exceljs.
 * Implemented by infrastructure (ExcelJsCatalogWorkbookCodec).
 */
export interface CatalogWorkbookCodec {
  /** Empty workbook with sheets, headers and instructions (no business data). */
  buildTemplate(): Promise<Uint8Array>;

  /** Workbook filled from a CatalogWorkbookDto (export). */
  buildExport(data: CatalogWorkbookDto): Promise<Uint8Array>;

  /** Parse .xlsx bytes into CatalogWorkbookDto (structure only; no business validation). */
  parse(bytes: Uint8Array): Promise<CatalogWorkbookDto>;
}
