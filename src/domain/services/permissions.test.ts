import { describe, expect, it } from "vitest";
import { canAccessSection, sectionsForRole } from "@/domain/services/permissions";

describe("role permissions", () => {
  it("allows vendedor only operational sections", () => {
    expect(canAccessSection("vendedor", "pos")).toBe(true);
    expect(canAccessSection("vendedor", "dashboard")).toBe(true);
    expect(canAccessSection("vendedor", "catalog")).toBe(false);
    expect(canAccessSection("vendedor", "users")).toBe(false);
    expect(sectionsForRole("vendedor")).toEqual(["dashboard", "pos"]);
  });

  it("allows admin full access", () => {
    expect(canAccessSection("admin", "backup")).toBe(true);
    expect(sectionsForRole("admin")).toContain("inventory");
  });
});
