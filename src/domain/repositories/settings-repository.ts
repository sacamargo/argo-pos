import type { ModuleVisibilityConfig } from "@/domain/entities/module-visibility";

export interface SettingsRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

export type { ModuleVisibilityConfig };
