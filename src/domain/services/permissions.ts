import type { UserRole } from "@/domain/entities/user";
import type { AppSection } from "@/shared/constants/navigation";

const ADMIN_ONLY: AppSection[] = ["catalog", "inventory", "users", "settings", "backup"];

export function canAccessSection(role: UserRole, section: AppSection): boolean {
  if (role === "admin") {
    return true;
  }

  return !ADMIN_ONLY.includes(section);
}

export function sectionsForRole(role: UserRole): AppSection[] {
  const all: AppSection[] = [
    "dashboard",
    "pos",
    "catalog",
    "inventory",
    "users",
    "settings",
    "backup",
  ];

  return all.filter((section) => canAccessSection(role, section));
}
