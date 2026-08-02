export type PaymentMethod = {
  id: string;
  name: string;
  code: string;
  active: boolean;
  sortOrder: number;
};

export type SaleStatus = "completed" | "reversed";

export type SaleItem = {
  id: string;
  saleId: string;
  productId: string | null;
  productNameSnapshot: string;
  unitPriceCentsSnapshot: number;
  quantity: number;
  lineTotalCents: number;
};

export type Sale = {
  id: string;
  cashSessionId: string;
  userId: string;
  paymentMethodId: string;
  status: SaleStatus;
  subtotalCents: number;
  totalCents: number;
  amountTenderedCents: number | null;
  changeCents: number | null;
  createdAt: string;
};

export type SaleWithItems = Sale & {
  items: SaleItem[];
  paymentMethodCode: string;
  paymentMethodName: string;
};
