export const APP_NAME = "Argo POS";

export const ROLES = {
  master: "master",
  admin: "admin",
  cashier: "cashier",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  master: "Master",
  admin: "Administrador",
  cashier: "Vendedor",
};
