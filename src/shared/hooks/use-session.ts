import { create } from "zustand";
import type { PublicUser } from "@/domain/entities/user";

const STORAGE_KEY = "argo-pos-session";

type SessionState = {
  user: PublicUser | null;
  hydrated: boolean;
  hydrate: () => void;
  setSession: (user: PublicUser) => void;
  clearSession: () => void;
};

function readStoredUser(): PublicUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      !("id" in parsed) ||
      !("username" in parsed) ||
      !("role" in parsed)
    ) {
      return null;
    }

    const candidate = parsed as PublicUser;
    if (
      typeof candidate.id !== "string" ||
      typeof candidate.username !== "string" ||
      (candidate.role !== "admin" && candidate.role !== "vendedor")
    ) {
      return null;
    }

    return candidate;
  } catch {
    return null;
  }
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  hydrated: false,
  hydrate: () => {
    set({ user: readStoredUser(), hydrated: true });
  },
  setSession: (user) => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    set({ user });
  },
  clearSession: () => {
    window.localStorage.removeItem(STORAGE_KEY);
    set({ user: null });
  },
}));
