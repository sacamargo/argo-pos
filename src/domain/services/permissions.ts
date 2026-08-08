import type { UserRole } from "@/domain/entities/user";
import type { ModuleVisibilityConfig } from "@/domain/entities/module-visibility";
import { defaultModuleVisibility } from "@/domain/entities/module-visibility";
import type { AppSection } from "@/shared/constants/navigation";
import { NAV_ITEMS } from "@/shared/constants/navigation";

export function canAccessSection(
  role: UserRole,
  section: AppSection,
  visibility?: ModuleVisibilityConfig | null,
): boolean {
  if (role === "master") {
    return true;
  }

  if (role !== "admin" && role !== "vendedor") {
    return false;
  }

  const config = visibility ?? defaultModuleVisibility();
  return Boolean(config[role][section]);
}

/** Admin, vendedor y master pueden anular ventas (motivo obligatorio). */
export function canReverseSale(role: UserRole): boolean {
  return role === "admin" || role === "vendedor" || role === "master";
}

export function sectionsForRole(
  role: UserRole,
  visibility?: ModuleVisibilityConfig | null,
): AppSection[] {
  return NAV_ITEMS.map((item) => item.id).filter((section) =>
    canAccessSection(role, section, visibility),
  );
}

/** Admin-like operational privileges (dashboard stock, etc.). */
export function isAdminLike(role: UserRole): boolean {
  return role === "admin" || role === "master";
}
