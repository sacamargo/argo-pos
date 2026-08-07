import type { Workbook } from "exceljs";
import type { CatalogWorkbookCodec } from "@/domain/catalog/catalog-workbook-codec";
import type { CatalogWorkbookDto } from "@/domain/catalog/catalog-workbook-dto";

type ExcelJsApi = {
  Workbook: new () => Workbook;
};

/**
 * ExcelJS adapter for CatalogWorkbookCodec.
 *
 * exceljs loads via dynamic import() so POS startup does not pay the Excel cost.
 * Template / export / parse land in later branches.
 */
export class ExcelJsCatalogWorkbookCodec implements CatalogWorkbookCodec {
  private exceljsPromise: Promise<ExcelJsApi> | null = null;

  private loadExcelJS(): Promise<ExcelJsApi> {
    if (!this.exceljsPromise) {
      this.exceljsPromise = import("exceljs").then((mod) => {
        const api = (mod as { default?: ExcelJsApi }).default ?? (mod as ExcelJsApi);
        return api;
      });
    }
    return this.exceljsPromise;
  }

  async buildTemplate(): Promise<Uint8Array> {
    await this.loadExcelJS();
    throw new Error("CatalogWorkbookCodec.buildTemplate is not implemented yet");
  }

  async buildExport(data: CatalogWorkbookDto): Promise<Uint8Array> {
    await this.loadExcelJS();
    void data;
    throw new Error("CatalogWorkbookCodec.buildExport is not implemented yet");
  }

  async parse(bytes: Uint8Array): Promise<CatalogWorkbookDto> {
    await this.loadExcelJS();
    void bytes;
    throw new Error("CatalogWorkbookCodec.parse is not implemented yet");
  }
}
