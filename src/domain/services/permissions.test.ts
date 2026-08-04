import { describe, expect, it } from "vitest";
import { canAccessSection, sectionsForRole } from "@/domain/services/permissions";

describe("role permissions", () => {
  it("allows vendedor only operational sections", () => {
    expect(canAccessSection("vendedor", "pos")).toBe(true);
    expect(canAccessSection("vendedor", "dashboard")).toBe(true);
    expect(canAccessSection("vendedor", "sales")).toBe(true);
    expect(canAccessSection("vendedor", "catalog")).toBe(false);
    expect(canAccessSection("vendedor", "users")).toBe(false);
    expect(canAccessSection("vendedor", "help")).toBe(true);
    expect(sectionsForRole("vendedor")).toEqual(["dashboard", "pos", "sales", "help"]);
  });

  it("allows admin full access", () => {
    expect(canAccessSection("admin", "backup")).toBe(true);
    expect(canAccessSection("admin", "sales")).toBe(true);
    expect(canAccessSection("admin", "help")).toBe(true);
    expect(sectionsForRole("admin")).toContain("inventory");
  });
});
