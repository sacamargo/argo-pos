import type { HelpModule } from "@/modules/help/content/types";

export const HELP_MODULES: HelpModule[] = [
  {
    id: "login",
    title: "Login",
    audience: "todos",
    summary:
      "Entrada a la app. Todo es local: no necesita internet. Si la base está vacía, el primer arranque crea usuarios seed.",
    whenToUse: "Al abrir Argo POS o después de pulsar Salir.",
    fields: [
      {
        name: "Usuario",
        expects: "Texto no vacío (trim).",
        notes: "Seed: admin · vendedor",
      },
      {
        name: "Contraseña",
        expects: "Texto no vacío.",
        notes: "Seed: admin123 · vendedor123",
      },
    ],
    actions: [
      {
        name: "Entrar",
        does: "Valida credenciales locales y abre la sesión. Si falla, muestra error sin salir de la pantalla.",
      },
    ],
    tips: [
      "Mensaje de onboarding: caja local, sin internet requerido.",
      "En Vite puro (localhost:1420) no hay SQLite nativo: usa pnpm tauri:dev o el instalador.",
    ],
  },
  {
    id: "shell",
    title: "Barra superior y menú",
    audience: "todos",
    summary:
      "Navegación y controles globales. El menú lateral muestra solo las secciones permitidas por rol.",
    whenToUse: "En cualquier pantalla autenticada.",
    fields: [],
    actions: [
      {
        name: "Menú lateral",
        does: "Cambia de sección (Dashboard, POS, Ventas…). Admin ve Catálogo, Inventario, Usuarios, Ajustes y Backup; vendedor no.",
      },
      {
        name: "Abrir / Cerrar caja (compacto)",
        does: "Abre los mismos modales de caja del Dashboard. Sin caja abierta no se puede cobrar en POS.",
      },
      {
        name: "Tema (sol/luna)",
        does: "Alterna tema claro/oscuro. Preferencia de interfaz local.",
      },
      {
        name: "Salir",
        does: "Cierra la sesión y vuelve al login. No borra la base de datos.",
      },
    ],
    tips: [
      "El chip muestra usuario · rol activos.",
      "Tutorial (esta guía) está disponible para admin y vendedor.",
    ],
  },
  {
    id: "corte",
    title: "Corte / Resumen del día",
    audience: "todos",
    summary:
      "Reporte de la jornada operativa: ventas, pagos, ganancia y top productos. El día es la fecha local de apertura de caja (aunque cierren después de medianoche).",
    whenToUse: "Al cerrar el turno o para revisar un día anterior.",
    fields: [
      {
        name: "Día operativo",
        expects: "Fecha YYYY-MM-DD",
        notes: "Filtra por openedAt de la caja, no por created_at de cada venta.",
      },
    ],
    actions: [
      {
        name: "(solo lectura)",
        does: "Muestra métricas del turno. No abre ni cierra caja.",
      },
    ],
    tips: [
      "Si faltan costos en productos, la ganancia se marca como parcial.",
      "Una venta del domingo 02:00 con caja abierta el sábado cuenta para el sábado.",
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    audience: "todos",
    summary:
      "Resumen del día: ventas, ingresos, última venta y estado de caja. El admin también ve stock crítico.",
    whenToUse: "Al iniciar el turno o para mirar el pulso del día.",
    fields: [],
    actions: [
      {
        name: "(solo lectura)",
        does: "Las cards muestran métricas calculadas en local. No editan datos.",
      },
      {
        name: "Abrir caja / Cerrar caja",
        does: "Misma lógica que en la barra superior (ver módulo Caja).",
      },
    ],
    tips: [
      "Vendedor: vista reducida (sin inventario crítico / acciones de admin).",
      "Anuladas no suman a ingresos del día.",
    ],
  },
  {
    id: "cash",
    title: "Caja (apertura / cierre)",
    audience: "vendedor+admin",
    summary:
      "Una sola sesión abierta a la vez. Es obligatoria para cobrar en el POS (regla MVP).",
    whenToUse: "Al empezar el turno (abrir) y al terminarlo (cerrar).",
    fields: [
      {
        name: "Monto inicial (COP)",
        expects: "Número ≥ 0 en pesos. Se guarda en centavos.",
        notes: "Ej.: 50000 = $50.000 de base en gaveta.",
      },
      {
        name: "Nota (apertura, opcional)",
        expects: "Texto hasta 200 caracteres.",
      },
      {
        name: "Monto contado (COP)",
        expects: "Número ≥ 0 en pesos al cerrar. Se guarda en centavos.",
        notes: "La UI muestra esperado y diferencia (contado − esperado).",
      },
      {
        name: "Nota (cierre, opcional)",
        expects: "Texto hasta 200 caracteres.",
      },
    ],
    actions: [
      {
        name: "Abrir caja",
        does: "Crea la sesión abierta con monto inicial, usuario y hora.",
      },
      {
        name: "Cerrar caja",
        does: "Cierra la sesión, registra diferencia/notas y dispara backup automático.",
      },
      {
        name: "Cancelar",
        does: "Cierra el modal sin guardar.",
      },
    ],
    tips: [
      "Sin caja abierta, Cobrar en POS queda bloqueado por regla de negocio.",
      "Al cerrar se intenta un backup automático con nota “Auto al cerrar caja”.",
    ],
  },
  {
    id: "pos",
    title: "POS (venta)",
    audience: "vendedor+admin",
    summary:
      "Corazón del producto: layout de 3 columnas (categorías, productos, carrito). Objetivo: cobrar en menos de 10 segundos.",
    whenToUse: "Para registrar cada venta del día.",
    fields: [
      {
        name: "Filtro de categoría",
        expects: "Tap en Todos o en una categoría activa.",
      },
      {
        name: "Descuento (COP)",
        expects: "Número ≥ 0 en pesos. Se convierte a centavos.",
        notes: "Opcional; reduce el total antes del cobro.",
      },
      {
        name: "Método de pago",
        expects: "Uno de los métodos seed (efectivo, etc.).",
      },
      {
        name: "Recibido (COP)",
        expects: "Solo efectivo: número ≥ total a pagar, en pesos.",
        notes: "La UI calcula el cambio. Botones Exacto / +1k…+50k ayudan a rellenar.",
      },
    ],
    actions: [
      {
        name: "Tarjeta de producto",
        does: "Agrega 1 unidad al carrito (imagen, nombre y precio).",
      },
      {
        name: "+ / − / eliminar",
        does: "Ajusta cantidad o quita la línea del carrito.",
      },
      {
        name: "Cobrar",
        does: "Abre el modal de pago. Deshabilitado si el carrito está vacío o no hay caja.",
      },
      {
        name: "Confirmar cobro",
        does: "Crea la venta, descuenta inventario por receta y muestra éxito. Evita doble cobro mientras está ocupado.",
      },
      {
        name: "Cancelar (pago)",
        does: "Cierra el modal sin vender.",
      },
      {
        name: "Nueva venta",
        does: "Limpia el carrito tras un cobro exitoso.",
      },
    ],
    tips: [
      "Precios en pantalla están en pesos; internamente todo es centavos enteros.",
      "Funciona 100% offline.",
    ],
  },
  {
    id: "sales",
    title: "Ventas (historial)",
    audience: "vendedor+admin",
    summary:
      "Consulta ventas del día/rango corto, filtra y anula con motivo. Las ventas no se editan: solo se anulan.",
    whenToUse: "Para revisar tickets, métodos de pago o corregir un cobro con anulación.",
    fields: [
      {
        name: "Fecha",
        expects: "Fecha del día a listar.",
      },
      {
        name: "Pago",
        expects: "Método concreto o Todos.",
      },
      {
        name: "Estado",
        expects: "Todas / Completadas / Anuladas.",
      },
      {
        name: "Motivo de anulación",
        expects: "Texto obligatorio, mínimo 3 y máximo 200 caracteres.",
      },
    ],
    actions: [
      {
        name: "Actualizar",
        does: "Vuelve a cargar el listado con los filtros.",
      },
      {
        name: "Fila / tarjeta de venta",
        does: "Abre el detalle (ítems, pago, cajero, cambio, estado).",
      },
      {
        name: "Anular",
        does: "Muestra confirmación; al confirmar revierte stock según receta y marca la venta anulada.",
      },
      {
        name: "Cerrar",
        does: "Cierra el detalle sin cambios.",
      },
    ],
    tips: [
      "Admin y vendedor pueden anular (motivo obligatorio).",
      "Una anulación no borra el historial: queda auditada.",
    ],
  },
  {
    id: "catalog",
    title: "Catálogo (productos y categorías)",
    audience: "admin",
    summary:
      "Administra qué se vende en el POS: categorías, productos, precio, imagen local y receta de ingredientes.",
    whenToUse: "Al armar el menú del negocio o cambiar precios.",
    fields: [
      {
        name: "Nombre de categoría",
        expects: "1–80 caracteres. Ej.: Granizados.",
      },
      {
        name: "Nombre de producto",
        expects: "1–120 caracteres.",
      },
      {
        name: "Categoría (producto)",
        expects: "Seleccionar una categoría activa.",
      },
      {
        name: "Precio (COP)",
        expects: "Número > 0 en pesos. Se guarda como price_cents (×100).",
      },
      {
        name: "Imagen",
        expects: "Archivo jpg/png/webp/gif ≤ 5 MB.",
        notes: "Se copia a AppConfig/images/ y se guarda el nombre de archivo.",
      },
      {
        name: "Receta · ingrediente",
        expects: "Ingrediente existente del inventario.",
      },
      {
        name: "Receta · cantidad",
        expects: "Número > 0 (step 0.01) en la unidad del ingrediente.",
        notes: "Receta vacía es válida (extras sin descuento de stock).",
      },
    ],
    actions: [
      {
        name: "Tabs Productos / Categorías",
        does: "Cambia entre formularios de producto y de categoría.",
      },
      {
        name: "Agregar (categoría)",
        does: "Crea categoría activa.",
      },
      {
        name: "Activar / Desactivar (categoría o producto)",
        does: "Oculta del POS sin borrar el registro.",
      },
      {
        name: "Crear producto / Actualizar / Nuevo",
        does: "Guarda o limpia el formulario de producto.",
      },
      {
        name: "Quitar imagen / Agregar ítem / Quitar (receta)",
        does: "Gestiona imagen y líneas de receta antes de guardar.",
      },
      {
        name: "Editar (listado)",
        does: "Carga el producto en el formulario.",
      },
    ],
    tips: [
      "Solo admin. El vendedor no ve esta sección.",
      "Sin imagen se muestra el placeholder “Sin imagen” en el POS.",
    ],
  },
  {
    id: "inventory",
    title: "Inventario",
    audience: "admin",
    summary:
      "Ingredientes y movimientos. El stock nunca se edita a mano: solo sube/baja con entradas o ajustes auditados.",
    whenToUse: "Compras, mermas o correcciones de inventario.",
    fields: [
      {
        name: "Nombre (ingrediente)",
        expects: "1–120 caracteres.",
      },
      {
        name: "Unidad",
        expects: "Texto corto (ml, g, und…), 1–20 caracteres.",
      },
      {
        name: "Stock mínimo",
        expects: "Número ≥ 0 (alerta de stock bajo).",
      },
      {
        name: "Stock inicial (opcional)",
        expects: "Número ≥ 0 al crear el ingrediente.",
      },
      {
        name: "Cantidad (entrada)",
        expects: "Número > 0.",
        notes: "Aumenta stock vía movimiento de compra.",
      },
      {
        name: "Cantidad (ajuste)",
        expects: "Número ≠ 0 (positivo suma, negativo resta).",
      },
      {
        name: "Nota",
        expects: "Entrada: opcional ≤200. Ajuste: obligatoria 1–200.",
      },
    ],
    actions: [
      {
        name: "Crear (ingrediente)",
        does: "Alta del ingrediente y stock inicial si aplica.",
      },
      {
        name: "Registrar entrada",
        does: "Compra/ingreso que aumenta stock con movimiento.",
      },
      {
        name: "Registrar ajuste",
        does: "Corrección ± con nota obligatoria (merma, conteo, etc.).",
      },
    ],
    tips: [
      "Las ventas descuentan según la receta del producto.",
      "Las anulaciones reintegran stock automáticamente.",
    ],
  },
  {
    id: "users",
    title: "Usuarios",
    audience: "admin",
    summary:
      "Altas de cuentas locales, roles y contraseñas. No se puede dejar el sistema sin al menos un admin activo.",
    whenToUse: "Cuando entra un cajero nuevo o hay que rotar accesos.",
    fields: [
      {
        name: "Usuario",
        expects: "3–40 caracteres: letras, números, . _ -",
      },
      {
        name: "Contraseña",
        expects: "6–100 caracteres al crear o cambiar.",
      },
      {
        name: "Rol",
        expects: "admin o vendedor.",
      },
      {
        name: "Nueva contraseña",
        expects: "Mínimo 6 caracteres. Guardar se habilita al cumplir el mínimo.",
      },
    ],
    actions: [
      {
        name: "Crear usuario",
        does: "Alta con hash local de contraseña.",
      },
      {
        name: "Contraseña (listado)",
        does: "Abre el formulario de cambio para ese usuario.",
      },
      {
        name: "Guardar (nueva contraseña)",
        does: "Actualiza la contraseña del usuario seleccionado.",
      },
      {
        name: "Activar / Desactivar",
        does: "Bloquea login sin borrar el usuario. No permite desactivar el último admin activo.",
      },
    ],
    tips: ["Solo admin. Credenciales viven solo en este PC."],
  },
  {
    id: "backup",
    title: "Backup",
    audience: "admin",
    summary:
      "Copia segura del archivo SQLite y restauración destructiva con doble confirmación.",
    whenToUse: "Antes de cambios riesgosos, al cerrar el día, o tras un incidente.",
    fields: [
      {
        name: "Nota (opcional)",
        expects: "Hasta 200 caracteres al crear el backup.",
      },
      {
        name: "Confirmación de restore",
        expects: 'Debes escribir exactamente RESTAURAR (mayúsculas).',
      },
    ],
    actions: [
      {
        name: "Backup ahora",
        does: "Copia argo-pos.db a la carpeta backups/ bajo AppConfig y registra metadata.",
      },
      {
        name: "Restaurar",
        does: "Inicia el flujo de 2 pasos. Reemplaza la DB actual y reinicia la app.",
      },
      {
        name: "Sí, continuar / Atrás / Confirmar restore / Cancelar",
        does: "Navegan la confirmación destructiva sin restaurar hasta el último paso.",
      },
    ],
    tips: [
      "Windows: %APPDATA%\\com.argo.pos\\ (db, backups\\, images\\).",
      "macOS: ~/Library/Application Support/com.argo.pos/",
      "También hay backup automático al cerrar caja.",
    ],
  },
  {
    id: "settings",
    title: "Ajustes",
    audience: "admin",
    summary:
      "Reservado para preferencias del negocio (FE-013). Hoy es placeholder; el tema ya se cambia desde la barra superior.",
    whenToUse: "Cuando exista configuración de nombre del negocio u otras preferencias.",
    fields: [],
    actions: [
      {
        name: "(próximamente)",
        does: "Tema, nombre del negocio y path de backup según TASK FE-013.",
      },
    ],
    tips: ["Mientras tanto usa el botón sol/luna del header para el tema."],
  },
  {
    id: "money",
    title: "Dinero y datos (reglas)",
    audience: "todos",
    summary:
      "Convenciones que cruzan todos los módulos. Evitan errores de redondeo y pérdida de auditoría.",
    whenToUse: "Siempre que captures precios, montos o interpretes totales.",
    fields: [
      {
        name: "Montos en UI",
        expects: "Pesos COP (enteros o decimales según el campo).",
      },
      {
        name: "Montos en base de datos",
        expects: "Centavos enteros (price_cents, amount_cents, etc.).",
        notes: "Ej.: $12.500 → 1250000 centavos.",
      },
    ],
    actions: [],
    tips: [
      "Ventas inmutables: no se editan; solo anulación + reversión de inventario.",
      "Inventario solo cambia por movimientos (nunca UPDATE de stock suelto).",
      "Offline first: la venta nunca depende de internet.",
    ],
  },
];
