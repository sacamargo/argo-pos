import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CashSessionSummary } from "@/domain/entities/cash-session";
import {
  resetCashSessionStore,
  useCashSessionStore,
} from "@/shared/hooks/use-cash-session";

const openSummary = vi.fn();
const openSession = vi.fn();
const closeSession = vi.fn();

vi.mock("@/application/container", () => ({
  getAppServices: async () => ({
    cashSessions: {
      getOpenSummary: openSummary,
      openSession,
      closeSession,
    },
  }),
}));

function makeSummary(overrides?: Partial<CashSessionSummary>): CashSessionSummary {
  return {
    session: {
      id: "sess-1",
      openedByUserId: "user-1",
      closedByUserId: null,
      openingAmountCents: 50_000,
      closingAmountCents: null,
      status: "open",
      note: null,
      openedAt: "2026-08-08T21:30:00.000Z",
      closedAt: null,
    },
    totals: {
      salesCount: 2,
      salesTotalCents: 20_000,
      cashSalesTotalCents: 15_000,
    },
    expectedCashCents: 65_000,
    differenceCents: null,
    ...overrides,
  };
}

describe("useCashSessionStore", () => {
  beforeEach(() => {
    resetCashSessionStore();
    openSummary.mockReset();
    openSession.mockReset();
    closeSession.mockReset();
  });

  it("refresh carga summary y marca hydrated", async () => {
    const summary = makeSummary();
    openSummary.mockResolvedValue(summary);

    await useCashSessionStore.getState().refresh();

    const state = useCashSessionStore.getState();
    expect(state.summary).toEqual(summary);
    expect(state.hydrated).toBe(true);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it("refresh con caja cerrada deja summary null", async () => {
    openSummary.mockResolvedValue(null);
    await useCashSessionStore.getState().refresh();
    expect(useCashSessionStore.getState().summary).toBeNull();
    expect(useCashSessionStore.getState().hydrated).toBe(true);
  });

  it("refresh en error setea error y loading false", async () => {
    openSummary.mockRejectedValue(new Error("db down"));
    await expect(useCashSessionStore.getState().refresh()).rejects.toThrow("db down");
    const state = useCashSessionStore.getState();
    expect(state.error).toBe("db down");
    expect(state.loading).toBe(false);
    expect(state.hydrated).toBe(true);
  });

  it("openSession abre y refresca el summary", async () => {
    const summary = makeSummary();
    openSession.mockResolvedValue(summary.session);
    openSummary.mockResolvedValue(summary);

    await useCashSessionStore.getState().openSession({
      openedByUserId: "user-1",
      openingAmountCents: 50_000,
    });

    expect(openSession).toHaveBeenCalledWith({
      openedByUserId: "user-1",
      openingAmountCents: 50_000,
    });
    expect(useCashSessionStore.getState().summary?.session.status).toBe("open");
    expect(useCashSessionStore.getState().summary?.session.openingAmountCents).toBe(
      50_000,
    );
  });

  it("openSession en error propaga y guarda mensaje", async () => {
    openSession.mockRejectedValue(new Error("Ya hay una caja abierta"));
    await expect(
      useCashSessionStore.getState().openSession({
        openedByUserId: "user-1",
        openingAmountCents: 0,
      }),
    ).rejects.toThrow("Ya hay una caja abierta");
    expect(useCashSessionStore.getState().error).toBe("Ya hay una caja abierta");
  });

  it("closeSession limpia summary tras cerrar", async () => {
    useCashSessionStore.setState({
      summary: makeSummary(),
      hydrated: true,
    });
    const closed = makeSummary({
      session: {
        ...makeSummary().session,
        status: "closed",
        closedByUserId: "user-1",
        closingAmountCents: 65_000,
        closedAt: "2026-08-09T10:00:00.000Z",
      },
      differenceCents: 0,
    });
    closeSession.mockResolvedValue(closed);

    const result = await useCashSessionStore.getState().closeSession({
      closedByUserId: "user-1",
      closingAmountCents: 65_000,
    });

    expect(result).toEqual(closed);
    expect(useCashSessionStore.getState().summary).toBeNull();
    expect(useCashSessionStore.getState().error).toBeNull();
    expect(useCashSessionStore.getState().hydrated).toBe(true);
  });

  it("closeSession en error conserva summary previo", async () => {
    const open = makeSummary();
    useCashSessionStore.setState({ summary: open, hydrated: true });
    closeSession.mockRejectedValue(new Error("No hay caja abierta"));

    await expect(
      useCashSessionStore.getState().closeSession({
        closedByUserId: "user-1",
        closingAmountCents: 0,
      }),
    ).rejects.toThrow("No hay caja abierta");

    expect(useCashSessionStore.getState().summary).toEqual(open);
    expect(useCashSessionStore.getState().error).toBe("No hay caja abierta");
  });
});
