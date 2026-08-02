import type { Role } from "@/modules/core/constants";

const managerRoutes = [
  "/dashboard",
  "/pos",
  "/catalog",
  "/inventory",
  "/sales",
] as const;

const cashierRoutes = ["/dashboard", "/pos", "/sales"] as const;
const masterOnlyRoutes = ["/users"] as const;

export function isStaffManager(role: Role): boolean {
  return role === "master" || role === "admin";
}

export function isMaster(role: Role): boolean {
  return role === "master";
}

export function isAdmin(role: Role): boolean {
  return isStaffManager(role);
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  if (masterOnlyRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return isMaster(role);
  }

  const allowed = isStaffManager(role) ? managerRoutes : cashierRoutes;
  return allowed.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function canManageCatalog(role: Role): boolean {
  return isStaffManager(role);
}

export function canManageInventory(role: Role): boolean {
  return isStaffManager(role);
}

export function canReverseSale(role: Role): boolean {
  return isStaffManager(role);
}

export function canManageUsers(role: Role): boolean {
  return isMaster(role);
}
