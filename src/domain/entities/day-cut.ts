import type { CashSession } from "@/domain/entities/cash-session";
import type { ProfitSummary } from "@/domain/services/profit";

export type DayCutPaymentTotal = {
  code: string;
  name: string;
  salesCount: number;
  totalCents: number;
};

export type DayCutTopProduct = {
  productName: string;
  quantity: number;
  revenueCents: number;
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
  topProducts: DayCutTopProduct[];
};
