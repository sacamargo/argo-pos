import { eq } from "drizzle-orm";
import { settings } from "@/database/schema";
import type { SettingsRepository } from "@/domain/repositories/settings-repository";
import type { AppDatabase } from "@/infrastructure/sqlite/client";

export class DrizzleSettingsRepository implements SettingsRepository {
  constructor(private readonly db: AppDatabase) {}

  async get(key: string): Promise<string | null> {
    const [row] = await this.db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const now = new Date().toISOString();
    const existing = await this.get(key);
    if (existing === null) {
      await this.db.insert(settings).values({ key, value, updatedAt: now });
      return;
    }
    await this.db
      .update(settings)
      .set({ value, updatedAt: now })
      .where(eq(settings.key, key));
  }
}
