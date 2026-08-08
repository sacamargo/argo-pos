export type UserRole = "admin" | "vendedor" | "master";

/** Roles visibles / asignables en la UI de usuarios (nunca master). */
export type AssignableUserRole = "admin" | "vendedor";

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export type PublicUser = {
  id: string;
  username: string;
  role: UserRole;
};

/** Usuario listable en admin (sin hash). Master nunca se lista. */
export type ManagedUser = {
  id: string;
  username: string;
  role: AssignableUserRole;
  active: boolean;
  createdAt: string;
};

export function isMasterRole(role: UserRole): boolean {
  return role === "master";
}

export function toManagedUser(user: User): ManagedUser | null {
  if (user.role === "master") {
    return null;
  }
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
  };
}
