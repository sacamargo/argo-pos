import { create } from "zustand";

export type ToastTone = "success" | "warning" | "error" | "info";

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  description?: string;
  durationMs: number;
  createdAt: number;
};

type ToastState = {
  items: ToastItem[];
  push: (item: Omit<ToastItem, "createdAt">) => void;
  dismiss: (id: string) => void;
  clear: () => void;
};

const MAX_VISIBLE = 4;

export const useToastStore = create<ToastState>((set) => ({
  items: [],
  push: (item) =>
    set((state) => {
      const withoutSame = state.items.filter((toast) => toast.id !== item.id);
      const next = [...withoutSame, { ...item, createdAt: Date.now() }];
      return { items: next.slice(-MAX_VISIBLE) };
    }),
  dismiss: (id) =>
    set((state) => ({
      items: state.items.filter((toast) => toast.id !== id),
    })),
  clear: () => set({ items: [] }),
}));

type NotifyInput = {
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Same id replaces an existing toast (dedupe). */
  id?: string;
  durationMs?: number;
};

let toastSeq = 0;

function defaultDuration(tone: ToastTone): number {
  if (tone === "success" || tone === "info") {
    return 4000;
  }
  return 6500;
}

/** Fire a Mac-style toast from anywhere (services/UI). */
export function notify(input: NotifyInput): string {
  const tone = input.tone ?? "info";
  const id = input.id ?? `toast-${Date.now()}-${++toastSeq}`;
  useToastStore.getState().push({
    id,
    tone,
    title: input.title,
    description: input.description,
    durationMs: input.durationMs ?? defaultDuration(tone),
  });
  return id;
}
