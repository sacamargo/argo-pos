import { invoke } from "@tauri-apps/api/core";
import type { BackupFileStore, SqliteBackupFile } from "@/domain/repositories/backup-file-store";
import { isTauriRuntime } from "@/infrastructure/sqlite/client";

type NativeBackupFile = {
  path: string;
  fileName: string;
  sizeBytes: number;
};

export class TauriBackupFileStore implements BackupFileStore {
  async createCopy(fileName: string): Promise<SqliteBackupFile> {
    if (!isTauriRuntime()) {
      throw new Error("Los backups solo están disponibles en la app de escritorio");
    }

    const result = await invoke<NativeBackupFile>("create_sqlite_backup", { fileName });
    return {
      path: result.path,
      fileName: result.fileName,
      sizeBytes: result.sizeBytes,
    };
  }

  async restoreFrom(path: string): Promise<void> {
    if (!isTauriRuntime()) {
      throw new Error("Restaurar solo está disponible en la app de escritorio");
    }

    await invoke("restore_sqlite_backup", { backupPath: path });
  }
}
