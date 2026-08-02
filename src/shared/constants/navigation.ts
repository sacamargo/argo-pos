export type AppSection =
  "dashboard" | "pos" | "catalog" | "inventory" | "users" | "settings" | "backup";

export type NavItem = {
  id: AppSection;
  label: string;
  description: string;
};

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", description: "Indicadores del día" },
  { id: "pos", label: "POS", description: "Vender en caja" },
  { id: "catalog", label: "Catálogo", description: "Productos y categorías" },
  { id: "inventory", label: "Inventario", description: "Ingredientes y movimientos" },
  { id: "users", label: "Usuarios", description: "Cuentas y roles" },
  { id: "settings", label: "Ajustes", description: "Preferencias del negocio" },
  { id: "backup", label: "Backup", description: "Respaldo y restauración" },
];
