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
