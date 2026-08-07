import { describe, expect, it, vi } from "vitest";
import {
  generateBusinessCode,
  resolveCreateBusinessCode,
} from "@/shared/utils/business-code";

describe("generateBusinessCode", () => {
  it("matches PREFIX-XXXXXX hex format", () => {
    expect(generateBusinessCode("CAT")).toMatch(/^CAT-[0-9A-F]{6}$/);
    expect(generateBusinessCode("INV")).toMatch(/^INV-[0-9A-F]{6}$/);
    expect(generateBusinessCode("PROD")).toMatch(/^PROD-[0-9A-F]{6}$/);
  });

  it("produces distinct values across calls", () => {
    const a = generateBusinessCode("CAT");
    const b = generateBusinessCode("CAT");
    expect(a).not.toBe(b);
  });
});

describe("resolveCreateBusinessCode", () => {
  it("uses provided code when free", async () => {
    const code = await resolveCreateBusinessCode("CAT", "cat-excel", async () => false);
    expect(code).toBe("CAT-EXCEL");
  });

  it("rejects provided code when taken", async () => {
    await expect(
      resolveCreateBusinessCode("CAT", "CAT-TAKEN", async () => true),
    ).rejects.toThrow(/Ya existe/);
  });

  it("generates when omitted and retries on collision", async () => {
    const isTaken = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const code = await resolveCreateBusinessCode("INV", undefined, isTaken);
    expect(code).toMatch(/^INV-[0-9A-F]{6}$/);
    expect(isTaken).toHaveBeenCalledTimes(2);
  });
});
