import { create } from "zustand";
import { getAppServices } from "@/application/container";
import type { ModuleVisibilityConfig } from "@/domain/entities/module-visibility";
import { defaultModuleVisibility } from "@/domain/entities/module-visibility";

type ModuleVisibilityState = {
  config: ModuleVisibilityConfig;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (config: ModuleVisibilityConfig) => Promise<void>;
};

export const useModuleVisibilityStore = create<ModuleVisibilityState>((set) => ({
  config: defaultModuleVisibility(),
  hydrated: false,
  hydrate: async () => {
    try {
      const { settings } = await getAppServices();
      const config = await settings.getModuleVisibility();
      set({ config, hydrated: true });
    } catch {
      set({ config: defaultModuleVisibility(), hydrated: true });
    }
  },
  save: async (config) => {
    const { settings } = await getAppServices();
    const next = await settings.setModuleVisibility(config);
    set({ config: next, hydrated: true });
  },
}));
