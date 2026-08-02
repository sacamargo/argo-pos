/** Port for native SQLite file backup/restore (implemented via Tauri commands). */
export type SqliteBackupFile = {
  path: string;
  fileName: string;
  sizeBytes: number;
};

export interface BackupFileStore {
  createCopy(fileName: string): Promise<SqliteBackupFile>;
  restoreFrom(path: string): Promise<void>;
}
