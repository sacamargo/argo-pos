import { z } from "zod";
import type {
  CashSession,
  CashSessionSummary,
} from "@/domain/entities/cash-session";
import type { CashSessionRepository } from "@/domain/repositories/cash-session-repository";
import { isLocalDateInput, localDayBounds } from "@/shared/utils/date";

export const openCashSessionSchema = z.object({
  openedByUserId: z.string().min(1, "Usuario obligatorio"),
  openingAmountCents: z
    .number()
    .int("El monto debe ser entero en centavos")
    .min(0, "El monto inicial no puede ser negativo"),
  note: z.string().trim().max(200).optional(),
});

export const closeCashSessionSchema = z.object({
  closedByUserId: z.string().min(1, "Usuario obligatorio"),
  closingAmountCents: z
    .number()
    .int("El monto debe ser entero en centavos")
    .min(0, "El monto contado no puede ser negativo"),
  note: z.string().trim().max(200).optional(),
});

function buildSummary(
  session: CashSession,
  totals: Awaited<ReturnType<CashSessionRepository["getSessionTotals"]>>,
): CashSessionSummary {
  const expectedCashCents = session.openingAmountCents + totals.cashSalesTotalCents;
  const differenceCents =
    session.closingAmountCents === null
      ? null
      : session.closingAmountCents - expectedCashCents;

  return {
    session,
    totals,
    expectedCashCents,
    differenceCents,
  };
}

export class CashSessionService {
  constructor(private readonly sessions: CashSessionRepository) {}

  async getOpenSession(): Promise<CashSession | null> {
    return this.sessions.findOpen();
  }

  async requireOpenSession(): Promise<CashSession> {
    const open = await this.sessions.findOpen();
    if (!open) {
      throw new Error("No hay caja abierta. Abre la caja antes de cobrar.");
    }
    return open;
  }

  async getSummary(sessionId: string): Promise<CashSessionSummary> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      throw new Error("Sesión de caja no encontrada");
    }
    const totals = await this.sessions.getSessionTotals(sessionId);
    return buildSummary(session, totals);
  }

  async getOpenSummary(): Promise<CashSessionSummary | null> {
    const open = await this.sessions.findOpen();
    if (!open) {
      return null;
    }
    return this.getSummary(open.id);
  }

  async listRecent(limit = 10): Promise<CashSession[]> {
    return this.sessions.listRecent(limit);
  }

  /**
   * Cash sessions that belong to a business day (local date of openedAt).
   * Supports multiple sessions on the same operating day.
   */
  async listByBusinessDay(dateInput: string): Promise<CashSession[]> {
    if (!isLocalDateInput(dateInput)) {
      throw new Error("Fecha inválida");
    }
    const { fromIso, toIso } = localDayBounds(dateInput);
    return this.sessions.listByOpenedAtRange(fromIso, toIso);
  }

  async openSession(raw: unknown): Promise<CashSession> {
    const input = openCashSessionSchema.parse(raw);
    const existing = await this.sessions.findOpen();
    if (existing) {
      throw new Error("Ya hay una caja abierta. Ciérrala antes de abrir otra.");
    }

    return this.sessions.create({
      id: crypto.randomUUID(),
      openedByUserId: input.openedByUserId,
      openingAmountCents: input.openingAmountCents,
      note: input.note ?? null,
      openedAt: new Date().toISOString(),
    });
  }

  async closeSession(raw: unknown): Promise<CashSessionSummary> {
    const input = closeCashSessionSchema.parse(raw);
    const open = await this.sessions.findOpen();
    if (!open) {
      throw new Error("No hay caja abierta para cerrar.");
    }

    const closed = await this.sessions.close({
      id: open.id,
      closedByUserId: input.closedByUserId,
      closingAmountCents: input.closingAmountCents,
      note: input.note ?? open.note,
      closedAt: new Date().toISOString(),
    });

    return this.getSummary(closed.id);
  }
}
