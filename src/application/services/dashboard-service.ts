import { z } from "zod";
import type { DashboardSnapshot } from "@/domain/entities/dashboard";
import type { UserRole } from "@/domain/entities/user";
import type { CashSessionRepository } from "@/domain/repositories/cash-session-repository";
import type { IngredientRepository } from "@/domain/repositories/ingredient-repository";
import type { SaleRepository } from "@/domain/repositories/sale-repository";
import { localDayBounds, todayLocalDateInput } from "@/shared/utils/date";

export const dashboardQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .optional(),
  role: z.enum(["admin", "vendedor"]),
});

export class DashboardService {
  constructor(
    private readonly sales: SaleRepository,
    private readonly cashSessions: CashSessionRepository,
    private readonly ingredients: IngredientRepository,
  ) {}

  async getSnapshot(raw: unknown): Promise<DashboardSnapshot> {
    const input = dashboardQuerySchema.parse(raw);
    const date = input.date ?? todayLocalDateInput();
    const { fromIso, toIso } = localDayBounds(date);
    const role = input.role as UserRole;

    const [summary, openSession, allIngredients] = await Promise.all([
      this.sales.summarizeCompletedDay(fromIso, toIso),
      this.cashSessions.findOpen(),
      role === "admin" ? this.ingredients.listAll() : Promise.resolve([]),
    ]);

    const lowStock =
      role === "admin"
        ? allIngredients.filter(
            (item) => item.active && item.stockQuantity <= item.minStock,
          )
        : [];

    return {
      date,
      salesCount: summary.salesCount,
      revenueCents: summary.revenueCents,
      unitsSold: summary.unitsSold,
      topProducts: summary.topProducts,
      lastSale: summary.lastSale,
      cashOpen: Boolean(openSession),
      cashOpeningCents: openSession?.openingAmountCents ?? null,
      lowStock,
    };
  }
}
