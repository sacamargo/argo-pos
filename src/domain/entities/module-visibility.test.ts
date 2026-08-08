import { describe, expect, it } from "vitest";
import {
  defaultModuleVisibility,
  parseModuleVisibility,
} from "@/domain/entities/module-visibility";

describe("module visibility parsing", () => {
  it("returns defaults for empty input", () => {
    expect(parseModuleVisibility(null)).toEqual(defaultModuleVisibility());
    expect(parseModuleVisibility("")).toEqual(defaultModuleVisibility());
  });

  it("merges partial JSON over defaults", () => {
    const parsed = parseModuleVisibility(
      JSON.stringify({ admin: { settings: false }, vendedor: { catalog: true } }),
    );
    expect(parsed.admin.settings).toBe(false);
    expect(parsed.admin.pos).toBe(true);
    expect(parsed.vendedor.catalog).toBe(true);
    expect(parsed.vendedor.pos).toBe(true);
  });
});
