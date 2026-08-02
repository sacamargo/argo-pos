import { desc, eq } from "drizzle-orm";
import { backups } from "@/database/schema";
import type { BackupRecord } from "@/domain/entities/backup";
import type {
  BackupRepository,
  CreateBackupRecordInput,
} from "@/domain/repositories/backup-repository";
import type { AppDatabase } from "@/infrastructure/sqlite/client";

function mapRow(row: typeof backups.$inferSelect): BackupRecord {
  return {
    id: row.id,
    filePath: row.filePath,
    sizeBytes: row.sizeBytes,
    note: row.note,
    createdAt: row.createdAt,
  };
}

export class DrizzleBackupRepository implements BackupRepository {
  constructor(private readonly db: AppDatabase) {}

  async listRecent(limit = 30): Promise<BackupRecord[]> {
    const rows = await this.db
      .select()
      .from(backups)
      .orderBy(desc(backups.createdAt))
      .limit(limit);

    return rows.map(mapRow);
  }

  async findById(id: string): Promise<BackupRecord | null> {
    const [row] = await this.db.select().from(backups).where(eq(backups.id, id)).limit(1);
    return row ? mapRow(row) : null;
  }

  async findLatest(): Promise<BackupRecord | null> {
    const [row] = await this.db
      .select()
      .from(backups)
      .orderBy(desc(backups.createdAt))
      .limit(1);

    return row ? mapRow(row) : null;
  }

  async create(input: CreateBackupRecordInput): Promise<BackupRecord> {
    await this.db.insert(backups).values({
      id: input.id,
      filePath: input.filePath,
      sizeBytes: input.sizeBytes,
      note: input.note,
      createdAt: input.createdAt,
    });

    const created = await this.findById(input.id);
    if (!created) {
      throw new Error("No se pudo registrar el backup");
    }
    return created;
  }
}
