import type { HelpVisualStep } from "@/modules/help/content/types";

/** Offline media lives in /public/help (svg now; drop .gif/.png here later). */
export const HELP_VISUAL_STEPS: Record<string, HelpVisualStep[]> = {
  login: [
    {
      title: "Abrir Argo POS",
      body: "Verás el login local. No hace falta internet. Completa Usuario y Contraseña y pulsa Entrar.",
      mediaSrc: "/help/login-1.svg",
      mediaAlt: "Pantalla de login con botón Entrar resaltado",
    },
    {
      title: "Credenciales seed",
      body: "En el primer arranque existen admin/admin123 y vendedor/vendedor123. Cámbialas en producción real.",
      mediaSrc: "/help/login-2.svg",
      mediaAlt: "Tarjeta con usuarios seed de prueba",
    },
  ],
  shell: [
    {
      title: "Menú según rol",
      body: "Admin ve Catálogo, Inventario, Usuarios, Ajustes y Backup. Vendedor solo Dashboard, POS, Ventas y Tutorial. Arriba: caja, tema y Salir.",
      mediaSrc: "/help/shell-1.svg",
      mediaAlt: "Menú lateral y barra superior",
    },
  ],
  dashboard: [
    {
      title: "Pulso del día",
      body: "Cards de solo lectura: ventas, ingresos, estado de caja. El admin también ve stock crítico.",
      mediaSrc: "/help/dashboard-1.svg",
      mediaAlt: "Cards del dashboard",
    },
  ],
  cash: [
    {
      title: "Abrir caja",
      body: "Ingresa el monto inicial en pesos COP (≥ 0). Sin caja abierta no se puede cobrar en el POS.",
      mediaSrc: "/help/cash-1.svg",
      mediaAlt: "Modal abrir caja",
    },
    {
      title: "Cerrar caja",
      body: "Cuenta el efectivo, escribe el monto contado y confirma. Se calcula la diferencia y se dispara backup automático.",
      mediaSrc: "/help/cash-2.svg",
      mediaAlt: "Modal cerrar caja con esperado",
    },
  ],
  pos: [
    {
      title: "Elegir producto",
      body: "Filtra por categoría y toca una tarjeta (imagen + nombre + precio) para sumarla al carrito.",
      mediaSrc: "/help/pos-1.svg",
      mediaAlt: "Grid de productos del POS",
    },
    {
      title: "Revisar carrito",
      body: "Ajusta cantidades, aplica descuento opcional en COP y pulsa Cobrar (requiere caja abierta).",
      mediaSrc: "/help/pos-2.svg",
      mediaAlt: "Carrito con botón Cobrar",
    },
    {
      title: "Confirmar cobro",
      body: "Elige método. En efectivo indica lo recibido (≥ total); la app calcula el cambio. Confirmar cobro registra la venta.",
      mediaSrc: "/help/pos-3.svg",
      mediaAlt: "Modal de pago en efectivo",
    },
  ],
  sales: [
    {
      title: "Historial y anular",
      body: "Filtra por fecha/pago/estado, abre el detalle y anula solo con motivo (≥ 3 caracteres). El stock vuelve.",
      mediaSrc: "/help/sales-1.svg",
      mediaAlt: "Historial de ventas y anulación",
    },
  ],
  catalog: [
    {
      title: "Alta de producto",
      body: "Nombre, categoría, precio en COP (> 0), imagen opcional ≤ 5 MB y receta opcional. Luego aparece en el POS.",
      mediaSrc: "/help/catalog-1.svg",
      mediaAlt: "Formulario de producto",
    },
  ],
  inventory: [
    {
      title: "Entrada de inventario",
      body: "Nunca edites stock a mano: registra una entrada (cantidad > 0) o un ajuste ± con nota.",
      mediaSrc: "/help/inventory-1.svg",
      mediaAlt: "Formulario de entrada de stock",
    },
  ],
  users: [
    {
      title: "Crear cuenta local",
      body: "Usuario 3–40 (a-z, 0-9, ._ -), contraseña ≥ 6 y rol admin/vendedor. No desactives el último admin.",
      mediaSrc: "/help/users-1.svg",
      mediaAlt: "Formulario crear usuario",
    },
  ],
  backup: [
    {
      title: "Backup ahora",
      body: "Copia segura de la SQLite a la carpeta backups/ del AppConfig. Puedes agregar una nota.",
      mediaSrc: "/help/backup-1.svg",
      mediaAlt: "Pantalla de backup",
    },
    {
      title: "Restaurar (destructivo)",
      body: "Dos pasos de confirmación. En el último debes escribir exactamente RESTAURAR. La app reinicia con ese snapshot.",
      mediaSrc: "/help/backup-2.svg",
      mediaAlt: "Confirmación RESTAURAR",
    },
  ],
  settings: [
    {
      title: "Ajustes pendientes",
      body: "FE-013 aún es placeholder. El tema claro/oscuro ya se cambia con el botón del header.",
      mediaSrc: "/help/settings-1.svg",
      mediaAlt: "Placeholder de ajustes",
    },
  ],
  money: [
    {
      title: "Pesos en UI, centavos en DB",
      body: "Escribes pesos COP en pantalla; Argo guarda centavos enteros (×100) para evitar redondeos.",
      mediaSrc: "/help/money-1.svg",
      mediaAlt: "Conversión pesos a centavos",
    },
  ],
};
