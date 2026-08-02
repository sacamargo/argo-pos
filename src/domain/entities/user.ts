export type UserRole = "admin" | "vendedor";

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

/** Usuario listable en admin (sin hash). */
export type ManagedUser = {
  id: string;
  username: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
};

export function toManagedUser(user: User): ManagedUser {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
  };
}
