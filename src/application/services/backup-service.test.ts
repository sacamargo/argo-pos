import { describe, expect, it } from "vitest";
import {
  createBackupSchema,
  restoreBackupSchema,
} from "@/application/services/backup-service";

describe("backup schemas", () => {
  it("accepts optional note", () => {
    expect(createBackupSchema.safeParse({ note: "Cierre turno" }).success).toBe(true);
    expect(createBackupSchema.safeParse({}).success).toBe(true);
  });

  it("requires exact restore confirmation phrase", () => {
    expect(
      restoreBackupSchema.safeParse({
        backupId: "b1",
        confirmPhrase: "RESTAURAR",
      }).success,
    ).toBe(true);
    expect(
      restoreBackupSchema.safeParse({
        backupId: "b1",
        confirmPhrase: "restaurar",
      }).success,
    ).toBe(false);
  });
});
