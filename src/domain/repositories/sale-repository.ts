import type { Sale, SaleItem, SaleWithItems } from "@/domain/entities/sale";

export type CreateSaleItemInput = {
  id: string;
  productId: string;
  productNameSnapshot: string;
  unitPriceCentsSnapshot: number;
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

export interface SaleRepository {
  create(input: CreateSaleRecordInput): Promise<Sale>;
  findByIdWithItems(id: string): Promise<SaleWithItems | null>;
  listItems(saleId: string): Promise<SaleItem[]>;
}
