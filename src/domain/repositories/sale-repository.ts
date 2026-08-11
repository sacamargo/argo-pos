import type {
  Sale,
  SaleDetail,
  SaleListItem,
  SaleItem,
  SaleReversal,
  SaleWithItems,
} from "@/domain/entities/sale";

export type CreateSaleItemInput = {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceCentsSnapshot: number;
  unitCostCentsSnapshot: number | null;
  quantity: number;
  lineTotalCents: number;
};

export type CreateSaleRecordInput = {
  id: string;
  cashSessionId: string;
  userId: string;
  paymentMethodId: string;
  subtotalCents: number;
  totalCents: number;
  amountTenderedCents: number | null;
  changeCents: number | null;
  createdAt: string;
  items: CreateSaleItemInput[];
};

export type CreateSaleReversalInput = {
  id: string;
  saleId: string;
  reason: string;
  userId: string;
  createdAt: string;
};

export type ListSalesFilter = {
  fromIso: string;
  toIso: string;
  paymentMethodId?: string | null;
  status?: "completed" | "reversed" | "all";
};

export type DaySalesSummary = {
  salesCount: number;
  revenueCents: number;
  unitsSold: number;
  topProducts: Array<{
    productName: string;
    quantity: number;
    revenueCents: number;
  }>;
  lastSale: SaleListItem | null;
};

export interface SaleRepository {
  create(input: CreateSaleRecordInput): Promise<Sale>;
  findByIdWithItems(id: string): Promise<SaleWithItems | null>;
  findDetailById(id: string): Promise<SaleDetail | null>;
  listItems(saleId: string): Promise<SaleItem[]>;
  list(filter: ListSalesFilter): Promise<SaleListItem[]>;
  summarizeCompletedDay(fromIso: string, toIso: string): Promise<DaySalesSummary>;
  markReversed(saleId: string): Promise<Sale>;
  createReversal(input: CreateSaleReversalInput): Promise<SaleReversal>;
  findReversalBySaleId(saleId: string): Promise<SaleReversal | null>;
  /** True if any sale_items row still points at this product (blocks hard delete). */
  isProductReferenced(productId: string): Promise<boolean>;
  /** Nulls sale_items.product_id so the product can be hard-deleted (keeps sale snapshots). */
  detachProductReferences(productId: string): Promise<number>;
}
