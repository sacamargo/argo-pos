import { describe, expect, it, vi } from "vitest";
import { DayCutService } from "@/application/services/day-cut-service";
import type { CashSession } from "@/domain/entities/cash-session";
import type { CashSessionRepository } from "@/domain/repositories/cash-session-repository";
import type { SaleRepository } from "@/domain/repositories/sale-repository";
import type { UserRepository } from "@/domain/repositories/user-repository";
import { localDayBounds } from "@/shared/utils/date";

function session(partial: Partial<CashSession> & Pick<CashSession, "id" | "openedAt">): CashSession {
  return {
    openedByUserId: "u1",
    closedByUserId: "u1",
    openingAmountCents: 50_000,
    closingAmountCents: 80_000,
    status: "closed",
    note: null,
    closedAt: new Date(2026, 7, 9, 5, 0, 0).toISOString(),
    ...partial,
  };
}

describe("DayCutService", () => {
  it("retorna vacío cuando no hay jornada", async () => {
    const cashSessions = {
      listByOpenedAtRange: vi.fn(async () => []),
    } as unknown as CashSessionRepository;
    const sales = {
      summarizeByCashSessionIds: vi.fn(),
    } as unknown as SaleRepository;
    const users = { findById: vi.fn() } as unknown as UserRepository;
    const service = new DayCutService(cashSessions, sales, users);

    const summary = await service.getDaySummary({ date: "2026-08-10" });
    expect(summary.sessions).toEqual([]);
    expect(summary.salesCount).toBe(0);
    expect(sales.summarizeByCashSessionIds).not.toHaveBeenCalled();
  });

  it("agrega ventas overnight al día de apertura", async () => {
    const overnight = session({
      id: "s-night",
      openedAt: new Date(2026, 7, 8, 16, 30, 0).toISOString(),
      openingAmountCents: 50_000,
    });
    const listByOpenedAtRange = vi.fn(async () => [overnight]);
    const summarizeByCashSessionIds = vi.fn(async () => ({
      salesCount: 3,
      revenueCents: 30_000,
      unitsSold: 5,
      payments: [
        { code: "cash", name: "Efectivo", salesCount: 2, totalCents: 20_000 },
        { code: "transfer", name: "Transferencia", salesCount: 1, totalCents: 10_000 },
      ],
      topProducts: [
        { productName: "Coronita", quantity: 4, revenueCents: 20_000 },
      ],
      profitLines: [
        {
          unitPriceCentsSnapshot: 10_000,
          unitCostCentsSnapshot: 6_000,
          quantity: 2,
        },
        {
          unitPriceCentsSnapshot: 5_000,
          unitCostCentsSnapshot: null,
          quantity: 1,
        },
      ],
    }));
    const cashSessions = { listByOpenedAtRange } as unknown as CashSessionRepository;
    const sales = { summarizeByCashSessionIds } as unknown as SaleRepository;
    const users = {
      findById: vi.fn(async () => ({
        id: "u1",
        username: "admin",
        role: "admin",
        active: true,
        passwordHash: "x",
        createdAt: "",
        updatedAt: "",
      })),
    } as unknown as UserRepository;

    const service = new DayCutService(cashSessions, sales, users);
    const summary = await service.getDaySummary({ date: "2026-08-08" });

    const { fromIso, toIso } = localDayBounds("2026-08-08");
    expect(listByOpenedAtRange).toHaveBeenCalledWith(fromIso, toIso);
    expect(summarizeByCashSessionIds).toHaveBeenCalledWith(["s-night"], 6);
    expect(summary.openingAmountCents).toBe(50_000);
    expect(summary.revenueCents).toBe(30_000);
    expect(summary.profit.profitCents).toBe(8_000);
    expect(summary.profit.missingCostLines).toBe(1);
    expect(summary.profit.isComplete).toBe(false);
    expect(summary.sessions[0]?.openedByUsername).toBe("admin");
  });

  it("completa costos faltantes del día y refresca el resumen", async () => {
    const overnight = session({
      id: "s-night",
      openedAt: new Date(2026, 7, 8, 16, 30, 0).toISOString(),
    });
    const listByOpenedAtRange = vi.fn(async () => [overnight]);
    const backfillMissingCostsForSessionIds = vi.fn(async () => 2);
    const summarizeByCashSessionIds = vi.fn(async () => ({
      salesCount: 1,
      revenueCents: 10_000,
      unitsSold: 1,
      payments: [],
      topProducts: [],
      profitLines: [
        {
          unitPriceCentsSnapshot: 10_000,
          unitCostCentsSnapshot: 4_500,
          quantity: 1,
        },
      ],
    }));

    const cashSessions = { listByOpenedAtRange } as unknown as CashSessionRepository;
    const sales = {
      summarizeByCashSessionIds,
      backfillMissingCostsForSessionIds,
    } as unknown as SaleRepository;
    const users = {
      findById: vi.fn(async () => ({
        id: "u1",
        username: "admin",
        role: "admin",
        active: true,
        passwordHash: "x",
        createdAt: "",
        updatedAt: "",
      })),
    } as unknown as UserRepository;

    const service = new DayCutService(cashSessions, sales, users);
    const result = await service.backfillMissingCosts({ date: "2026-08-08" });

    expect(backfillMissingCostsForSessionIds).toHaveBeenCalledWith(["s-night"]);
    expect(result.updatedLines).toBe(2);
    expect(result.summary.profit.missingCostLines).toBe(0);
    expect(result.summary.profit.profitCents).toBe(5_500);
  });

  it("no completa costos si el día no tiene jornada", async () => {
    const cashSessions = {
      listByOpenedAtRange: vi.fn(async () => []),
    } as unknown as CashSessionRepository;
    const sales = {
      backfillMissingCostsForSessionIds: vi.fn(),
    } as unknown as SaleRepository;
    const users = { findById: vi.fn() } as unknown as UserRepository;
    const service = new DayCutService(cashSessions, sales, users);

    await expect(service.backfillMissingCosts({ date: "2026-08-10" })).rejects.toThrow(
      "No hay jornada de caja para este día.",
    );
    expect(sales.backfillMissingCostsForSessionIds).not.toHaveBeenCalled();
  });
});
