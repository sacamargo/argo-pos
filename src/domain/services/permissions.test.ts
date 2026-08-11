import { describe, expect, it } from "vitest";
import { defaultModuleVisibility } from "@/domain/entities/module-visibility";
import {
  canAccessSection,
  isAdminLike,
  sectionsForRole,
} from "@/domain/services/permissions";

describe("role permissions", () => {
  it("allows vendedor only operational sections by default", () => {
    expect(canAccessSection("vendedor", "pos")).toBe(true);
    expect(canAccessSection("vendedor", "dashboard")).toBe(true);
    expect(canAccessSection("vendedor", "sales")).toBe(true);
    expect(canAccessSection("vendedor", "catalog")).toBe(false);
    expect(canAccessSection("vendedor", "users")).toBe(false);
    expect(canAccessSection("vendedor", "help")).toBe(true);
    expect(sectionsForRole("vendedor")).toEqual([
      "dashboard",
      "corte",
      "pos",
      "sales",
      "help",
    ]);
  });

  it("allows admin full access by default", () => {
    expect(canAccessSection("admin", "backup")).toBe(true);
    expect(canAccessSection("admin", "sales")).toBe(true);
    expect(canAccessSection("admin", "help")).toBe(true);
    expect(sectionsForRole("admin")).toContain("inventory");
  });

  it("allows master every section regardless of visibility flags", () => {
    const locked = defaultModuleVisibility();
    locked.admin.settings = false;
    locked.vendedor.pos = false;
    expect(canAccessSection("master", "settings", locked)).toBe(true);
    expect(canAccessSection("master", "users", locked)).toBe(true);
    expect(isAdminLike("master")).toBe(true);
  });

  it("hides modules when master disables them for a role", () => {
    const visibility = defaultModuleVisibility();
    visibility.admin.settings = false;
    visibility.vendedor.help = false;
    expect(canAccessSection("admin", "settings", visibility)).toBe(false);
    expect(canAccessSection("admin", "catalog", visibility)).toBe(true);
    expect(canAccessSection("vendedor", "help", visibility)).toBe(false);
    expect(canAccessSection("vendedor", "pos", visibility)).toBe(true);
  });
});
