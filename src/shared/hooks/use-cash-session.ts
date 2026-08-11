import { create } from "zustand";
import { getAppServices } from "@/application/container";
import type { CashSessionSummary } from "@/domain/entities/cash-session";

export type OpenCashSessionInput = {
  openedByUserId: string;
  openingAmountCents: number;
  note?: string;
};

export type CloseCashSessionInput = {
  closedByUserId: string;
  closingAmountCents: number;
  note?: string;
};

type CashSessionState = {
  summary: CashSessionSummary | null;
  loading: boolean;
  error: string | null;
  hydrated: boolean;
  refresh: () => Promise<void>;
  openSession: (input: OpenCashSessionInput) => Promise<void>;
  closeSession: (input: CloseCashSessionInput) => Promise<CashSessionSummary>;
};

const initialState = {
  summary: null as CashSessionSummary | null,
  loading: false,
  error: null as string | null,
  hydrated: false,
};

export const useCashSessionStore = create<CashSessionState>((set, get) => ({
  ...initialState,
  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const { cashSessions } = await getAppServices();
      const summary = await cashSessions.getOpenSummary();
      set({ summary, loading: false, hydrated: true, error: null });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo cargar el estado de caja.";
      set({
        loading: false,
        hydrated: true,
        error: message,
      });
      throw err;
    }
  },
  openSession: async (input) => {
    set({ error: null });
    try {
      const { cashSessions } = await getAppServices();
      await cashSessions.openSession(input);
      await get().refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo abrir la caja";
      set({ error: message });
      throw err;
    }
  },
  closeSession: async (input) => {
    set({ error: null });
    try {
      const { cashSessions } = await getAppServices();
      const closed = await cashSessions.closeSession(input);
      // Tras cerrar no hay sesión open: summary queda null.
      set({ summary: null, hydrated: true, error: null, loading: false });
      return closed;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo cerrar la caja";
      set({ error: message });
      throw err;
    }
  },
}));

/** Test helper: reset store between cases. */
export function resetCashSessionStore(): void {
  useCashSessionStore.setState({ ...initialState });
}
