import type { CashSession, CashSessionTotals } from "@/domain/entities/cash-session";

export type OpenCashSessionInput = {
  id: string;
  openedByUserId: string;
  openingAmountCents: number;
  note: string | null;
  openedAt: string;
};

export type CloseCashSessionInput = {
  id: string;
  closedByUserId: string;
  closingAmountCents: number;
  note: string | null;
  closedAt: string;
};

export interface CashSessionRepository {
  findOpen(): Promise<CashSession | null>;
  findById(id: string): Promise<CashSession | null>;
  listRecent(limit: number): Promise<CashSession[]>;
  /** Sessions whose openedAt falls in the local calendar day [fromIso, toIso]. */
  listByOpenedAtRange(fromIso: string, toIso: string): Promise<CashSession[]>;
  create(input: OpenCashSessionInput): Promise<CashSession>;
  close(input: CloseCashSessionInput): Promise<CashSession>;
  getSessionTotals(sessionId: string): Promise<CashSessionTotals>;
}
