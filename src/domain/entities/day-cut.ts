import type { CashSession } from "@/domain/entities/cash-session";
import type { ProfitSummary } from "@/domain/services/profit";

export type DayCutPaymentTotal = {
  code: string;
  name: string;
  salesCount: number;
  totalCents: number;
};

export type DayCutSoldProduct = {
  productId: string | null;
  productName: string;
  quantity: number;
  revenueCents: number;
  /** Líneas de venta del día sin unit_cost_cents_snapshot. */
  missingCostLines: number;
  /** Costo actual del producto en catálogo (null = sin precio de compra). */
  productCostCents: number | null;
};

export type DayCutSessionInfo = {
  session: CashSession;
  openedByUsername: string | null;
  closedByUsername: string | null;
};

export type DayCutSummary = {
  /** Local operating day YYYY-MM-DD (from cash session openedAt). */
  businessDate: string;
  sessions: DayCutSessionInfo[];
  /** Sum of openingAmountCents across sessions that day. */
  openingAmountCents: number;
  salesCount: number;
  revenueCents: number;
  unitsSold: number;
  payments: DayCutPaymentTotal[];
  profit: ProfitSummary;
  soldProducts: DayCutSoldProduct[];
};
