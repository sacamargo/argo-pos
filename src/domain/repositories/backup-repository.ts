import type { BackupRecord } from "@/domain/entities/backup";

export type CreateBackupRecordInput = {
  id: string;
  filePath: string;
  sizeBytes: number | null;
  note: string | null;
  createdAt: string;
};

export interface BackupRepository {
  listRecent(limit?: number): Promise<BackupRecord[]>;
  findById(id: string): Promise<BackupRecord | null>;
  findLatest(): Promise<BackupRecord | null>;
  create(input: CreateBackupRecordInput): Promise<BackupRecord>;
}
