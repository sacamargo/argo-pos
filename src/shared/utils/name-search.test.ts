import { describe, expect, it } from "vitest";
import { matchesNameSearch } from "@/shared/utils/name-search";

describe("matchesNameSearch", () => {
  it("matches empty query to everything", () => {
    expect(matchesNameSearch("Doritos", "")).toBe(true);
    expect(matchesNameSearch("Doritos", "   ")).toBe(true);
  });

  it("matches partial names case-insensitively", () => {
    expect(matchesNameSearch("Granizado mora", "mora")).toBe(true);
    expect(matchesNameSearch("Doritos", "DORI")).toBe(true);
    expect(matchesNameSearch("Vaso 16 oz", "vaso")).toBe(true);
  });

  it("rejects non-matching names", () => {
    expect(matchesNameSearch("Doritos", "cerveza")).toBe(false);
  });
});
