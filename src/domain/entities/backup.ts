export type BackupRecord = {
  id: string;
  filePath: string;
  sizeBytes: number | null;
  note: string | null;
  createdAt: string;
};
