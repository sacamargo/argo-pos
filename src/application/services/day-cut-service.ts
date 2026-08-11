import { z } from "zod";
import type { DayCutSummary } from "@/domain/entities/day-cut";
import type { CashSessionRepository } from "@/domain/repositories/cash-session-repository";
import type { SaleRepository } from "@/domain/repositories/sale-repository";
import type { UserRepository } from "@/domain/repositories/user-repository";
import { summarizeProfit } from "@/domain/services/profit";
import { isLocalDateInput, localDayBounds } from "@/shared/utils/date";

export const dayCutQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .refine((value) => isLocalDateInput(value), "Fecha inválida"),
});

export class DayCutService {
  constructor(
    private readonly cashSessions: CashSessionRepository,
    private readonly sales: SaleRepository,
    private readonly users: UserRepository,
  ) {}

  async getDaySummary(raw: unknown): Promise<DayCutSummary> {
    const input = dayCutQuerySchema.parse(raw);
    const businessDate = input.date;
    const { fromIso, toIso } = localDayBounds(businessDate);
    const sessions = await this.cashSessions.listByOpenedAtRange(fromIso, toIso);

    if (sessions.length === 0) {
      return {
        businessDate,
        sessions: [],
        openingAmountCents: 0,
        salesCount: 0,
        revenueCents: 0,
        unitsSold: 0,
        payments: [],
        profit: { profitCents: 0, missingCostLines: 0, isComplete: false },
        topProducts: [],
      };
    }

    const usernameById = new Map<string, string>();
    const userIds = new Set<string>();
    for (const session of sessions) {
      userIds.add(session.openedByUserId);
      if (session.closedByUserId) {
        userIds.add(session.closedByUserId);
      }
    }
    await Promise.all(
      [...userIds].map(async (id) => {
        const user = await this.users.findById(id);
        if (user) {
          usernameById.set(id, user.username);
        }
      }),
    );

    const aggregate = await this.sales.summarizeByCashSessionIds(
      sessions.map((session) => session.id),
      6,
    );

    return {
      businessDate,
      sessions: sessions.map((session) => ({
        session,
        openedByUsername: usernameById.get(session.openedByUserId) ?? null,
        closedByUsername: session.closedByUserId
          ? (usernameById.get(session.closedByUserId) ?? null)
          : null,
      })),
      openingAmountCents: sessions.reduce(
        (sum, session) => sum + session.openingAmountCents,
        0,
      ),
      salesCount: aggregate.salesCount,
      revenueCents: aggregate.revenueCents,
      unitsSold: aggregate.unitsSold,
      payments: aggregate.payments,
      profit: summarizeProfit(aggregate.profitLines),
      topProducts: aggregate.topProducts,
    };
  }
}
