import { z } from "zod";
import type { BackupRecord } from "@/domain/entities/backup";
import type { BackupFileStore } from "@/domain/repositories/backup-file-store";
import type { BackupRepository } from "@/domain/repositories/backup-repository";
import { closeDatabase } from "@/infrastructure/sqlite/client";

export const createBackupSchema = z.object({
  note: z.string().trim().max(200).optional(),
});

export const restoreBackupSchema = z.object({
  backupId: z.string().min(1),
  confirmPhrase: z
    .string()
    .refine((value) => value === "RESTAURAR", "Escribe RESTAURAR para confirmar"),
});

function buildFileName(now = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .slice(0, 19);
  return `argo-pos-${stamp}.db`;
}

export class BackupService {
  constructor(
    private readonly backups: BackupRepository,
    private readonly files: BackupFileStore,
  ) {}

  async listRecent(limit = 30): Promise<BackupRecord[]> {
    return this.backups.listRecent(limit);
  }

  async getLatest(): Promise<BackupRecord | null> {
    return this.backups.findLatest();
  }

  async createBackup(raw: unknown = {}): Promise<BackupRecord> {
    const input = createBackupSchema.parse(raw ?? {});
    const fileName = buildFileName();
    const file = await this.files.createCopy(fileName);

    return this.backups.create({
      id: crypto.randomUUID(),
      filePath: file.path,
      sizeBytes: file.sizeBytes,
      note: input.note ?? null,
      createdAt: new Date().toISOString(),
    });
  }

  /**
   * Replaces the live DB with a backup file, then reloads the app.
   * Caller must show destructive confirmation in UI first.
   */
  async restoreBackup(raw: unknown): Promise<void> {
    const input = restoreBackupSchema.parse(raw);
    const record = await this.backups.findById(input.backupId);
    if (!record) {
      throw new Error("Backup no encontrado");
    }

    await closeDatabase();
    await this.files.restoreFrom(record.filePath);

    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }
}
