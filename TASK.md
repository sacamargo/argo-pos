# TASK.md — Argo POS (MVP local-first)

> Backlog oficial derivado de [ARCHITECTURE.md](./ARCHITECTURE.md).
>
> Cada tarea es una unidad de trabajo. Preferir una rama por épica o por tarea grande según [GIT-FLOW.md](./GIT-FLOW.md).
>
> Estados sugeridos: `todo` · `doing` · `done` · `blocked`

---

## Leyenda

| Prefijo | Capa |
|---------|------|
| `FE` | Frontend / UI (React, Vite, Tailwind, shadcn) |
| `BE` | Backend local (Domain, Application, Infrastructure, Drizzle, SQLite, Tauri) |
| `QA` | Testing / QA (Vitest, Playwright, checklist manual) |
| `DX` | Tooling, scaffold, empaquetado, CI local |

Prioridad: `P0` crítico para vender · `P1` necesario MVP · `P2` pulido MVP

---

# Fase 0 — Fundación (DX / BE)

## DX-001 · Scaffold del monorepo Tauri + Vite + React + TS `[P0]` `done`

- [x] Inicializar app Tauri v2 + Vite + React + TypeScript (strict)
- [x] Configurar pnpm, Node LTS, scripts (`dev`, `build`, `tauri:dev`, `tauri:build`)
- [x] ESLint + Prettier alineados al stack
- [x] Estructura de carpetas según ARCHITECTURE.md
- [x] README mínimo de arranque local

**Criterio de hecho:** `pnpm tauri:dev` abre ventana vacía sin errores. ✅

## DX-002 · Design system base `[P0]` `done`

- [x] Tailwind + tokens (claro/oscuro)
- [x] Tipografía Inter + Lucide
- [x] Componentes base shadcn: Button, Input, Card, Modal, Table, Badge
- [x] Layout shell (Header / Sidebar / Content)
- [x] Theme toggle (claro/oscuro) persistido localmente

**Criterio de hecho:** shell navegable con tema claro/oscuro. ✅

## BE-001 · SQLite + Drizzle bootstrap `[P0]` `done`

- [x] Configurar Drizzle + SQLite (ruta de archivo en app data)
- [x] Pipeline de migraciones
- [x] Conexión única / pool seguro en proceso local
- [x] Seed mínimo (admin inicial, métodos de pago, categorías demo opcionales)

**Criterio de hecho:** app crea/abre DB al iniciar; migraciones aplican solas. ✅

## BE-002 · Schema Core MVP `[P0]` `done`

Tablas mínimas (ajustar nombres al dominio, sin inventar ERP):

- [x] `users` (rol admin/vendedor, password hash, active)
- [x] `categories`
- [x] `products` (+ imagen path, precio, estado, categoría)
- [x] `product_recipes` / recipe items → ingredientes
- [x] `ingredients` (stock cache derivado o saldo + min)
- [x] `inventory_movements` + catálogo de motivos
- [x] `payment_methods`
- [x] `cash_sessions` (apertura/cierre)
- [x] `sales` (inmutables) + `sale_items` + `sale_reversals`
- [x] `settings` / preferencias (tema, paths backup)
- [x] `backups` metadata (fecha, path)

**Criterio de hecho:** migraciones verdes; seed reproducible. ✅

## BE-003 · Capas Domain / Application / Infrastructure `[P0]` `done`

- [x] Contratos de repositories (interfaces en domain)
- [x] Implementaciones Drizzle en infrastructure
- [x] Application services (orquestación + Zod)
- [x] Regla: UI no importa Drizzle/SQLite/Tauri directo

**Criterio de hecho:** un caso de uso (login o listar categorías) atraviesa todas las capas. ✅

## BE-004 · Seguridad local de usuarios `[P0]` `done`

- [x] Hash de contraseñas (nunca texto plano)
- [x] Sesión local segura (quién está logueado)
- [x] Guards por rol (admin vs vendedor)

**Criterio de hecho:** vendedor no puede abrir rutas/módulos de admin. ✅

## QA-001 · Base de testing `[P1]` `done`

- [x] Vitest configurado
- [ ] Helpers de DB en memoria/archivo temporal para tests
- [x] Convención de tests por capa (domain/service primero)

**Criterio de hecho:** `pnpm test` corre al menos 1 test de dominio. ✅

---

# Fase 1 — Auth y shell

## FE-001 · Login táctil `[P0]` `done`

- [x] Pantalla login (usuario/contraseña, botones grandes)
- [x] Validación Zod + RHF
- [x] Feedback de error claro
- [x] Redirect post-login según rol

## BE-005 · AuthService.login / logout / session `[P0]` `done`

- [x] Validar credenciales
- [x] Persistencia de sesión local
- [x] Logout limpia sesión

## QA-002 · Auth `[P0]` `doing`

- [x] Unit: hash/verify password
- [ ] Service: login ok / fail / usuario inactivo
- [ ] E2E (Playwright o checklist): login admin y vendedor

---

# Fase 2 — Catálogo (productos + categorías)

## BE-006 · CategoryService CRUD `[P0]` `done`

- [x] Crear / listar / editar / activar-desactivar
- [x] Un solo nivel (sin árbol)

## FE-002 · Pantalla Categorías (admin) `[P0]` `done`

- [x] Lista + alta rápida
- [x] Soft deactivate

## BE-007 · ProductService CRUD + receta `[P0]`

- [ ] Producto: nombre, categoría, imagen, precio, estado
- [ ] Receta: ingredientes + cantidades
- [ ] Validar precio > 0 y categoría existente

## FE-003 · Pantalla Productos (admin) `[P0]`

- [ ] Grid/lista táctil
- [ ] Formulario crear/editar
- [ ] Selector de imagen local
- [ ] Editor de receta simple

## FE-004 · Carga de imágenes locales `[P1]`

- [ ] Guardar en carpeta de datos de la app
- [ ] Referenciar path en producto
- [ ] Placeholder si no hay imagen

## QA-003 · Catálogo `[P0]`

- [ ] Tests service producto/categoría
- [ ] Receta inválida rechazada
- [ ] UI: crear producto aparece en POS

---

# Fase 3 — Inventario

## BE-008 · InventoryService `[P0]`

- [ ] Alta ingredientes
- [ ] Entrada (compra)
- [ ] Ajuste (+/−)
- [ ] Listar movimientos
- [ ] Stock bajo (min)
- [ ] Nunca UPDATE directo de stock sin movimiento

## FE-005 · Pantalla Inventario (admin) `[P0]`

- [ ] Lista ingredientes + estado crítico
- [ ] Form entrada / ajuste
- [ ] Historial de movimientos

## QA-004 · Inventario `[P0]`

- [ ] Entrada aumenta stock vía movimiento
- [ ] Ajuste negativo no “rompe” auditoría
- [ ] Alertas de stock bajo correctas

---

# Fase 4 — Caja (apertura / cierre)

## BE-009 · CashSessionService `[P0]`

- [ ] Abrir caja (monto inicial, usuario, timestamp)
- [ ] Cerrar caja (monto contado, diferencia, notas)
- [ ] Una sesión abierta a la vez
- [ ] Bloquear cobro si no hay caja abierta (regla de negocio MVP)

## FE-006 · UI apertura / cierre de caja `[P0]`

- [ ] Modal/pantalla abrir
- [ ] Modal cerrar con resumen del turno
- [ ] Indicador “Caja abierta” en header/dashboard

## QA-005 · Caja `[P0]`

- [ ] No vender sin sesión abierta
- [ ] Cierre registra totales del período
- [ ] Reapertura solo tras cierre

---

# Fase 5 — POS (corazón del producto) `[P0]`

## BE-010 · Cart domain (puro) `[P0]`

- [ ] Add / remove / change qty
- [ ] Subtotal, descuento, total
- [ ] Sin I/O (fácil de testear)

## BE-011 · SaleService.createSale `[P0]`

- [ ] Transacción atómica: sale + items + movimientos inventario
- [ ] Snapshot nombres/precios en líneas
- [ ] Métodos de pago
- [ ] Efectivo: amount tendered + change; bloquear si insuficiente
- [ ] Validar stock según política (bloquear / tolerancia)
- [ ] Exigir caja abierta
- [ ] Latencia objetivo local &lt; 100 ms percibida / venta confiable &lt; 500 ms

## BE-012 · SaleService.reverseSale `[P0]`

- [ ] Solo anulación (no edición)
- [ ] Motivo obligatorio
- [ ] Movimientos inversos de inventario
- [ ] Estado `reversed`
- [ ] Permisos (admin; vendedor según regla definida)

## FE-007 · Pantalla POS layout 3 columnas `[P0]`

- [ ] Izquierda: categorías (Todos + lista)
- [ ] Centro: grid productos (imagen, nombre, precio)
- [ ] Derecha: carrito permanente siempre visible
- [ ] Touch-first: botones grandes, pocos pasos

## FE-008 · Carrito + cobro + cambio `[P0]`

- [ ] Qty +/−, quitar línea
- [ ] Subtotal / descuento / total
- [ ] Selector método de pago
- [ ] Calculadora de cambio (efectivo) con teclas rápidas
- [ ] Botón Cobrar dominante
- [ ] Feedback éxito (ticket/id local) y error (stock, caja cerrada)

## FE-009 · Máquina de estados POS (UI) `[P1]`

- [ ] idle → browsing → cart → payment → submitting → success/error
- [ ] Evitar dobles cobros

## QA-006 · POS / ventas `[P0]`

- [ ] Unit: cart totals y change
- [ ] Service: createSale descuenta receta
- [ ] Service: reverseSale restaura stock
- [ ] E2E: venta efectivo con cambio en &lt; 10 s de interacción
- [ ] E2E: doble click en Cobrar no duplica venta
- [ ] Offline: sin red, la venta se guarda igual

---

# Fase 6 — Historial y dashboard

## BE-013 · SaleQueryService `[P0]`

- [ ] Listar ventas (día / rango corto)
- [ ] Detalle por id (items, pago, cajero, cambio, estado)
- [ ] Filtro por método de pago (opcional MVP)

## FE-010 · Historial + detalle `[P0]`

- [ ] Lista táctil con método y hora
- [ ] Detalle completo
- [ ] Acción anular (con confirmación)

## BE-014 · Dashboard analytics local `[P0]`

- [ ] Ventas del día / ingresos
- [ ] Productos vendidos (top o conteo)
- [ ] Última venta
- [ ] Estado caja abierta/cerrada
- [ ] Stock crítico (admin)

## FE-011 · Dashboard `[P0]`

- [ ] Cards mínimas
- [ ] Sin gráficas decorativas
- [ ] Vendedor: versión reducida (sin inventario crítico / admin)

## QA-007 · Historial / dashboard `[P1]`

- [ ] Totales del día coinciden con sales completed
- [ ] Anuladas no suman a ingresos
- [ ] Detalle muestra snapshots correctos

---

# Fase 7 — Usuarios y settings

## BE-015 · UserService (admin) `[P0]`

- [ ] Crear usuario (admin/vendedor)
- [ ] Activar/desactivar
- [ ] Cambiar password
- [ ] No permitir quedarse sin admin activo

## FE-012 · Pantalla Usuarios `[P0]`

- [ ] Lista + alta
- [ ] Toggle activo
- [ ] Solo admin

## FE-013 · Settings `[P1]`

- [ ] Tema
- [ ] Datos del negocio (nombre)
- [ ] Preferencias de backup path (si aplica)

## QA-008 · Usuarios / permisos `[P0]`

- [ ] Vendedor no entra a productos/inventario/usuarios/backups
- [ ] Admin sí

---

# Fase 8 — Backups `[P0]`

## BE-016 · BackupService `[P0]`

- [ ] Backup manual (copiar archivo SQLite de forma segura)
- [ ] Metadata: fecha, path, tamaño
- [ ] Restaurar backup (con confirmación destructiva)
- [ ] Backup automático (intervalo / al cerrar caja / al salir) — definir 1 estrategia simple
- [ ] Mostrar último backup

## FE-014 · Pantalla Backups (admin) `[P0]`

- [ ] Botón backup ahora
- [ ] Listado / última fecha
- [ ] Restaurar con doble confirmación

## QA-009 · Backups `[P0]`

- [ ] Tras restore, datos coinciden con snapshot
- [ ] Backup no corrompe DB abierta (lock/safe copy)
- [ ] Fallo de disco muestra error claro

---

# Fase 9 — Empaquetado y hardening

## DX-003 · Build Windows ejecutable `[P0]`

- [ ] `tauri build` genera instalador/ejecutable
- [ ] Icono y nombre Argo POS
- [ ] Rutas de datos en AppData (no cwd del exe)

## DX-004 · Primer arranque / onboarding mínimo `[P1]`

- [ ] Crear admin si DB vacía
- [ ] Seed métodos de pago
- [ ] Mensaje “caja local / sin internet requerido”

## QA-010 · Release checklist `[P0]`

- [ ] Instalar en PC limpio Windows
- [ ] Flujo completo: login → abrir caja → vender → anular → backup → restore
- [ ] Sin internet durante todo el flujo
- [ ] UPS scenario: reinicio app recupera DB

## QA-011 · Performance / touch QA `[P1]`

- [ ] Targets UX ARCHITECTURE (venta &lt; 10 s, acciones locales &lt; 100 ms percibidas)
- [ ] Botones usable a dedo (altura mínima)
- [ ] Sin modales innecesarios en cobro feliz

---

# Orden de ejecución recomendado

```text
Fase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9
```

El POS (Fase 5) no empieza en serio sin: DB, auth, catálogo mínimo, inventario mínimo y caja.

---

# Fuera de alcance (no crear tareas MVP)

Facturación electrónica, impresoras, barcode, cajón, multi-sucursal, sync nube, CRM, compras, proveedores, contabilidad, promociones complejas, fidelización, integraciones.

Si aparece una petición así: abrir issue `future/`, no contaminar ramas MVP.

---

# Definición de “MVP listo”

Un admin puede:

1. Instalar el `.exe`
2. Crear productos/categorías e ingredientes
3. Abrir caja
4. Vender en efectivo con cambio offline
5. Ver historial y anular una venta (stock vuelve)
6. Hacer backup y restaurar

Un vendedor puede:

1. Login
2. Abrir/usar POS (según permisos de caja definidos)
3. Cobrar y ver historial básico

Sin internet en ningún paso.
