export type CashSessionStatus = "open" | "closed";

export type CashSession = {
  id: string;
  openedByUserId: string;
  closedByUserId: string | null;
  openingAmountCents: number;
  closingAmountCents: number | null;
  status: CashSessionStatus;
  note: string | null;
  openedAt: string;
  closedAt: string | null;
};

export type CashSessionTotals = {
  salesCount: number;
  salesTotalCents: number;
  cashSalesTotalCents: number;
};

export type CashSessionSummary = {
  session: CashSession;
  totals: CashSessionTotals;
  /** opening + ventas en efectivo del turno */
  expectedCashCents: number;
  /** Solo con cierre: contado − esperado */
  differenceCents: number | null;
};
