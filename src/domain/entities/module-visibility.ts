import type { AppSection } from "@/shared/constants/navigation";
import { NAV_ITEMS } from "@/shared/constants/navigation";

export type ManagedNavRole = "admin" | "vendedor";

export type RoleModuleFlags = Record<AppSection, boolean>;

export type ModuleVisibilityConfig = {
  admin: RoleModuleFlags;
  vendedor: RoleModuleFlags;
};

function allSections(value: boolean): RoleModuleFlags {
  return Object.fromEntries(
    NAV_ITEMS.map((item) => [item.id, value]),
  ) as RoleModuleFlags;
}

/** Defaults match historical permissions (before master visibility flags). */
export function defaultModuleVisibility(): ModuleVisibilityConfig {
  return {
    admin: allSections(true),
    vendedor: {
      ...allSections(false),
      dashboard: true,
      pos: true,
      sales: true,
      help: true,
    },
  };
}

export function parseModuleVisibility(raw: string | null | undefined): ModuleVisibilityConfig {
  const fallback = defaultModuleVisibility();
  if (!raw?.trim()) {
    return fallback;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      return fallback;
    }
    const record = parsed as Record<string, unknown>;
    return {
      admin: mergeRoleFlags(fallback.admin, record.admin),
      vendedor: mergeRoleFlags(fallback.vendedor, record.vendedor),
    };
  } catch {
    return fallback;
  }
}

function mergeRoleFlags(base: RoleModuleFlags, raw: unknown): RoleModuleFlags {
  if (!raw || typeof raw !== "object") {
    return { ...base };
  }
  const source = raw as Record<string, unknown>;
  const next = { ...base };
  for (const item of NAV_ITEMS) {
    const flag = source[item.id];
    if (typeof flag === "boolean") {
      next[item.id] = flag;
    }
  }
  return next;
}
