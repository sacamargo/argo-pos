export type AppSection =
  | "dashboard"
  | "pos"
  | "sales"
  | "catalog"
  | "inventory"
  | "users"
  | "settings"
  | "backup"
  | "help";

export type NavItem = {
  id: AppSection;
  label: string;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", description: "Indicadores del día" },
  { id: "pos", label: "POS", description: "Vender en caja" },
  { id: "sales", label: "Ventas", description: "Historial de ventas" },
  { id: "catalog", label: "Catálogo", description: "Productos y categorías" },
  { id: "inventory", label: "Inventario", description: "Ingredientes y movimientos" },
  { id: "users", label: "Usuarios", description: "Cuentas y roles" },
  { id: "settings", label: "Ajustes", description: "Preferencias del negocio" },
  { id: "backup", label: "Backup", description: "Respaldo y restauración" },
  { id: "help", label: "Tutorial", description: "Guía de cada módulo" },
];
