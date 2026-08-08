import { MODULE_VISIBILITY_SETTING_KEY } from "@/database/constants";
import type { ModuleVisibilityConfig } from "@/domain/entities/module-visibility";
import {
  defaultModuleVisibility,
  parseModuleVisibility,
} from "@/domain/entities/module-visibility";
import type { SettingsRepository } from "@/domain/repositories/settings-repository";

export class SettingsService {
  constructor(private readonly settings: SettingsRepository) {}

  async getModuleVisibility(): Promise<ModuleVisibilityConfig> {
    const raw = await this.settings.get(MODULE_VISIBILITY_SETTING_KEY);
    return parseModuleVisibility(raw);
  }

  async setModuleVisibility(config: ModuleVisibilityConfig): Promise<ModuleVisibilityConfig> {
    const normalized: ModuleVisibilityConfig = {
      admin: { ...defaultModuleVisibility().admin, ...config.admin },
      vendedor: { ...defaultModuleVisibility().vendedor, ...config.vendedor },
    };
    await this.settings.set(
      MODULE_VISIBILITY_SETTING_KEY,
      JSON.stringify(normalized),
    );
    return normalized;
  }
}
