import { describe, expect, it, vi } from "vitest";
import { CashSessionService } from "@/application/services/cash-session-service";
import type { CashSession } from "@/domain/entities/cash-session";
import type { CashSessionRepository } from "@/domain/repositories/cash-session-repository";
import { localDayBounds } from "@/shared/utils/date";

function session(partial: Partial<CashSession> & Pick<CashSession, "id" | "openedAt">): CashSession {
  return {
    openedByUserId: "u1",
    closedByUserId: null,
    openingAmountCents: 50_000,
    closingAmountCents: null,
    status: "open",
    note: null,
    closedAt: null,
    ...partial,
  };
}

describe("CashSessionService.listByBusinessDay", () => {
  it("consulta el rango local del día operativo", async () => {
    const listByOpenedAtRange = vi.fn(async () => [] as CashSession[]);
    const repo = {
      listByOpenedAtRange,
    } as unknown as CashSessionRepository;
    const service = new CashSessionService(repo);

    await service.listByBusinessDay("2026-08-08");

    const { fromIso, toIso } = localDayBounds("2026-08-08");
    expect(listByOpenedAtRange).toHaveBeenCalledWith(fromIso, toIso);
  });

  it("soporta múltiples sesiones el mismo día", async () => {
    const morning = session({
      id: "s1",
      openedAt: new Date(2026, 7, 8, 10, 0, 0).toISOString(),
      status: "closed",
      closedAt: new Date(2026, 7, 8, 14, 0, 0).toISOString(),
      closedByUserId: "u1",
      closingAmountCents: 60_000,
    });
    const evening = session({
      id: "s2",
      openedAt: new Date(2026, 7, 8, 16, 30, 0).toISOString(),
      closedAt: new Date(2026, 7, 9, 5, 0, 0).toISOString(),
      status: "closed",
      closedByUserId: "u1",
      closingAmountCents: 80_000,
    });
    const repo = {
      listByOpenedAtRange: vi.fn(async () => [morning, evening]),
    } as unknown as CashSessionRepository;
    const service = new CashSessionService(repo);

    const rows = await service.listByBusinessDay("2026-08-08");
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.id)).toEqual(["s1", "s2"]);
  });

  it("día sin sesiones retorna vacío", async () => {
    const repo = {
      listByOpenedAtRange: vi.fn(async () => []),
    } as unknown as CashSessionRepository;
    const service = new CashSessionService(repo);
    await expect(service.listByBusinessDay("2026-08-10")).resolves.toEqual([]);
  });

  it("rechaza fecha inválida", async () => {
    const repo = {
      listByOpenedAtRange: vi.fn(),
    } as unknown as CashSessionRepository;
    const service = new CashSessionService(repo);
    await expect(service.listByBusinessDay("nope")).rejects.toThrow("Fecha inválida");
  });
});
