import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { cashSessions, paymentMethods, sales } from "@/database/schema";
import type { CashSession, CashSessionTotals } from "@/domain/entities/cash-session";
import type {
  CashSessionRepository,
  CloseCashSessionInput,
  OpenCashSessionInput,
} from "@/domain/repositories/cash-session-repository";
import type { AppDatabase } from "@/infrastructure/sqlite/client";

function mapRow(row: typeof cashSessions.$inferSelect): CashSession {
  return {
    id: row.id,
    openedByUserId: row.openedByUserId,
    closedByUserId: row.closedByUserId,
    openingAmountCents: row.openingAmountCents,
    closingAmountCents: row.closingAmountCents,
    status: row.status,
    note: row.note,
    openedAt: row.openedAt,
    closedAt: row.closedAt,
  };
}

export class DrizzleCashSessionRepository implements CashSessionRepository {
  constructor(private readonly db: AppDatabase) {}

  async findOpen(): Promise<CashSession | null> {
    const [row] = await this.db
      .select()
      .from(cashSessions)
      .where(eq(cashSessions.status, "open"))
      .limit(1);

    return row ? mapRow(row) : null;
  }

  async findById(id: string): Promise<CashSession | null> {
    const [row] = await this.db
      .select()
      .from(cashSessions)
      .where(eq(cashSessions.id, id))
      .limit(1);

    return row ? mapRow(row) : null;
  }

  async listRecent(limit: number): Promise<CashSession[]> {
    const rows = await this.db
      .select()
      .from(cashSessions)
      .orderBy(desc(cashSessions.openedAt))
      .limit(limit);

    return rows.map(mapRow);
  }

  async listByOpenedAtRange(fromIso: string, toIso: string): Promise<CashSession[]> {
    const rows = await this.db
      .select()
      .from(cashSessions)
      .where(
        and(gte(cashSessions.openedAt, fromIso), lte(cashSessions.openedAt, toIso)),
      )
      .orderBy(asc(cashSessions.openedAt));

    return rows.map(mapRow);
  }

  async create(input: OpenCashSessionInput): Promise<CashSession> {
    await this.db.insert(cashSessions).values({
      id: input.id,
      openedByUserId: input.openedByUserId,
      closedByUserId: null,
      openingAmountCents: input.openingAmountCents,
      closingAmountCents: null,
      status: "open",
      note: input.note,
      openedAt: input.openedAt,
      closedAt: null,
    });

    const created = await this.findById(input.id);
    if (!created) {
      throw new Error("No se pudo abrir la sesión de caja");
    }
    return created;
  }

  async close(input: CloseCashSessionInput): Promise<CashSession> {
    await this.db
      .update(cashSessions)
      .set({
        closedByUserId: input.closedByUserId,
        closingAmountCents: input.closingAmountCents,
        status: "closed",
        note: input.note,
        closedAt: input.closedAt,
      })
      .where(eq(cashSessions.id, input.id));

    const closed = await this.findById(input.id);
    if (!closed) {
      throw new Error("No se pudo cerrar la sesión de caja");
    }
    return closed;
  }

  async getSessionTotals(sessionId: string): Promise<CashSessionTotals> {
    const [allSales] = await this.db
      .select({
        salesCount: sql<number>`count(*)`.mapWith(Number),
        salesTotalCents: sql<number>`coalesce(sum(${sales.totalCents}), 0)`.mapWith(Number),
      })
      .from(sales)
      .where(and(eq(sales.cashSessionId, sessionId), eq(sales.status, "completed")));

    const [cashSales] = await this.db
      .select({
        cashSalesTotalCents: sql<number>`coalesce(sum(${sales.totalCents}), 0)`.mapWith(
          Number,
        ),
      })
      .from(sales)
      .innerJoin(paymentMethods, eq(sales.paymentMethodId, paymentMethods.id))
      .where(
        and(
          eq(sales.cashSessionId, sessionId),
          eq(sales.status, "completed"),
          eq(paymentMethods.code, "cash"),
        ),
      );

    return {
      salesCount: allSales?.salesCount ?? 0,
      salesTotalCents: allSales?.salesTotalCents ?? 0,
      cashSalesTotalCents: cashSales?.cashSalesTotalCents ?? 0,
    };
  }
}
