import { z } from "zod";
import type { DayCutSummary } from "@/domain/entities/day-cut";
import type { CashSessionRepository } from "@/domain/repositories/cash-session-repository";
import type { ProductRepository } from "@/domain/repositories/product-repository";
import type { SaleRepository } from "@/domain/repositories/sale-repository";
import type { UserRepository } from "@/domain/repositories/user-repository";
import { summarizeProfit } from "@/domain/services/profit";
import { isLocalDateInput, localDayBounds } from "@/shared/utils/date";
import { pesosToCents } from "@/shared/utils/money";

export const dayCutQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .refine((value) => isLocalDateInput(value), "Fecha inválida"),
});

export const setDayCutProductCostSchema = dayCutQuerySchema.extend({
  productId: z.string().min(1, "Producto obligatorio"),
  costPesos: z
    .number()
    .finite("Precio de compra inválido")
    .min(0, "El precio de compra no puede ser negativo"),
});

export class DayCutService {
  constructor(
    private readonly cashSessions: CashSessionRepository,
    private readonly sales: SaleRepository,
    private readonly users: UserRepository,
    private readonly products: ProductRepository,
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
        soldProducts: [],
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
      soldProducts: aggregate.soldProducts,
    };
  }

  /**
   * Completa snapshots de costo faltantes del día operativo con el costo actual
   * del producto. No sobrescribe costos ya congelados.
   */
  async backfillMissingCosts(raw: unknown): Promise<{
    updatedLines: number;
    summary: DayCutSummary;
  }> {
    const input = dayCutQuerySchema.parse(raw);
    const { fromIso, toIso } = localDayBounds(input.date);
    const sessions = await this.cashSessions.listByOpenedAtRange(fromIso, toIso);
    if (sessions.length === 0) {
      throw new Error("No hay jornada de caja para este día.");
    }

    const updatedLines = await this.sales.backfillMissingCostsForSessionIds(
      sessions.map((session) => session.id),
    );
    const summary = await this.getDaySummary({ date: input.date });
    return { updatedLines, summary };
  }

  /**
   * Guarda el precio de compra del producto y lo aplica a las líneas del día
   * que aún no tenían costo congelado.
   */
  async setProductCost(raw: unknown): Promise<{
    updatedLines: number;
    summary: DayCutSummary;
  }> {
    const input = setDayCutProductCostSchema.parse(raw);
    const { fromIso, toIso } = localDayBounds(input.date);
    const sessions = await this.cashSessions.listByOpenedAtRange(fromIso, toIso);
    if (sessions.length === 0) {
      throw new Error("No hay jornada de caja para este día.");
    }

    const existing = await this.products.findByIdWithRecipe(input.productId);
    if (!existing) {
      throw new Error("Producto no encontrado");
    }

    const costCents = pesosToCents(input.costPesos);
    await this.products.updateCostCents(input.productId, costCents);

    const updatedLines = await this.sales.backfillMissingCostsForSessionIds(
      sessions.map((session) => session.id),
      input.productId,
    );
    const summary = await this.getDaySummary({ date: input.date });
    return { updatedLines, summary };
  }
}
