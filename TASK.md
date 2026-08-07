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

## BE-007 · ProductService CRUD + receta `[P0]` `done`

- [x] Producto: nombre, categoría, imagen, precio, estado
- [x] Receta: ingredientes + cantidades
- [x] Validar precio > 0 y categoría existente
- [x] Códigos únicos internos (`code`) en categorías / productos / inventario
- [x] Auto-generación `generateBusinessCode` (sin UI; inmutables en update)
- [x] Tipo `simple` | `compound` + vínculo stock / receta
- [x] `resolveConsumption` unificado en venta
- [x] `CatalogService` fachada (snapshot + orquestación; Excel pendiente)
- [x] `CatalogWorkbookCodec` port + adapter ExcelJS (stubs; plantilla/export/import pendientes)
- [x] `buildTemplate()` plantilla oficial (hojas + headers + ejemplos)
- [x] `buildExport()` DTO → workbook (sin UI)
- [x] `parse()` XLSX → CatalogWorkbookDto (sin validación de negocio)
- [x] `CatalogWorkbookValidator` DTO → ValidationReport (sin DB)
- [x] `CatalogImportService` apply/upsert por `code` (sin UI)
- [x] UI admin Excel (tab Catálogo: plantilla / export / import + dry-run)

## FE-003 · Pantalla Productos (admin) `[P0]` `done`

- [x] Grid/lista táctil
- [x] Formulario crear/editar
- [x] Selector de imagen local
- [x] Editor de receta simple
- [x] Alta simple vs compound (códigos internos, sin campos en UI)

## FE-004 · Carga de imágenes locales `[P1]` `done`

- [x] Guardar en carpeta de datos de la app
- [x] Referenciar path en producto
- [x] Placeholder si no hay imagen

## QA-003 · Catálogo `[P0]` `doing`

- [x] Tests service producto/categoría
- [x] Receta inválida rechazada
- [ ] UI: crear producto aparece en POS

---

# Fase 3 — Inventario

## BE-008 · InventoryService `[P0]` `done`

- [x] Alta ingredientes
- [x] Entrada (compra)
- [x] Ajuste (+/−)
- [x] Listar movimientos
- [x] Stock bajo (min)
- [x] Nunca UPDATE directo de stock sin movimiento

## FE-005 · Pantalla Inventario (admin) `[P0]` `done`

- [x] Lista ingredientes + estado crítico
- [x] Form entrada / ajuste
- [x] Historial de movimientos

## QA-004 · Inventario `[P0]` `doing`

- [x] Entrada aumenta stock vía movimiento
- [x] Ajuste negativo no “rompe” auditoría
- [ ] Alertas de stock bajo correctas

---

# Fase 4 — Caja (apertura / cierre)

## BE-009 · CashSessionService `[P0]` `done`

- [x] Abrir caja (monto inicial, usuario, timestamp)
- [x] Cerrar caja (monto contado, diferencia, notas)
- [x] Una sesión abierta a la vez
- [x] Bloquear cobro si no hay caja abierta (regla de negocio MVP)

## FE-006 · UI apertura / cierre de caja `[P0]` `done`

- [x] Modal/pantalla abrir
- [x] Modal cerrar con resumen del turno
- [x] Indicador “Caja abierta” en header/dashboard

## QA-005 · Caja `[P0]` `doing`

- [x] No vender sin sesión abierta (`requireOpenSession`)
- [x] Cierre registra totales del período
- [x] Reapertura solo tras cierre

---

# Fase 5 — POS (corazón del producto) `[P0]`

## BE-010 · Cart domain (puro) `[P0]` `done`

- [x] Add / remove / change qty
- [x] Subtotal, descuento, total
- [x] Sin I/O (fácil de testear)

## BE-011 · SaleService.createSale `[P0]` `done`

- [x] Transacción atómica: sale + items + movimientos inventario
- [x] Snapshot nombres/precios en líneas
- [x] Métodos de pago
- [x] Efectivo: amount tendered + change; bloquear si insuficiente
- [x] Validar stock según política (bloquear)
- [x] Exigir caja abierta
- [x] Latencia objetivo local &lt; 100 ms percibida / venta confiable &lt; 500 ms

## BE-012 · SaleService.reverseSale `[P0]` `done`

- [x] Solo anulación (no edición)
- [x] Motivo obligatorio
- [x] Movimientos inversos de inventario
- [x] Estado `reversed`
- [x] Permisos (admin y vendedor)

## FE-007 · Pantalla POS layout 3 columnas `[P0]` `done`

- [x] Izquierda: categorías (Todos + lista)
- [x] Centro: grid productos (imagen, nombre, precio)
- [x] Derecha: carrito permanente siempre visible
- [x] Touch-first: botones grandes, pocos pasos

## FE-008 · Carrito + cobro + cambio `[P0]` `done`

- [x] Qty +/−, quitar línea
- [x] Subtotal / descuento / total
- [x] Selector método de pago
- [x] Calculadora de cambio (efectivo) con teclas rápidas
- [x] Botón Cobrar dominante
- [x] Feedback éxito (ticket/id local) y error (stock, caja cerrada)

## FE-009 · Máquina de estados POS (UI) `[P1]`

- [ ] idle → browsing → cart → payment → submitting → success/error
- [x] Evitar dobles cobros (`busy` flag)

## QA-006 · POS / ventas `[P0]` `doing`

- [x] Unit: cart totals y change
- [ ] Service: createSale descuenta receta
- [x] Service: reverseSale schemas / motivo
- [ ] E2E: venta efectivo con cambio en &lt; 10 s de interacción
- [x] E2E: doble click en Cobrar no duplica venta
- [ ] Offline: sin red, la venta se guarda igual

---

# Fase 6 — Historial y dashboard

## BE-013 · SaleQueryService `[P0]` `done`

- [x] Listar ventas (día / rango corto)
- [x] Detalle por id (items, pago, cajero, cambio, estado)
- [x] Filtro por método de pago (opcional MVP)

## FE-010 · Historial + detalle `[P0]` `done`

- [x] Lista táctil con método y hora
- [x] Detalle completo
- [x] Acción anular (con confirmación)

## BE-014 · Dashboard analytics local `[P0]` `done`

- [x] Ventas del día / ingresos
- [x] Productos vendidos (top o conteo)
- [x] Última venta
- [x] Estado caja abierta/cerrada
- [x] Stock crítico (admin)

## FE-011 · Dashboard `[P0]` `done`

- [x] Cards mínimas
- [x] Sin gráficas decorativas
- [x] Vendedor: versión reducida (sin inventario crítico / admin)

## QA-007 · Historial / dashboard `[P1]` `doing`

- [x] Totales del día coinciden con sales completed (anuladas excluidas en summary)
- [x] Anuladas no suman a ingresos
- [ ] Detalle muestra snapshots correctos

---

# Fase 7 — Usuarios y settings

## BE-015 · UserService (admin) `[P0]` `done`

- [x] Crear usuario (admin/vendedor)
- [x] Activar/desactivar
- [x] Cambiar password
- [x] No permitir quedarse sin admin activo

## FE-012 · Pantalla Usuarios `[P0]` `done`

- [x] Lista + alta
- [x] Toggle activo
- [x] Solo admin

## FE-013 · Settings `[P1]`

- [ ] Tema
- [ ] Datos del negocio (nombre)
- [ ] Preferencias de backup path (si aplica)

## FE-015 · Tutorial in-app `[P1]` `done`

- [x] Sección Tutorial en menú (admin y vendedor)
- [x] Guías por módulo: propósito, campos, botones, tips
- [x] Contenido alineado a validaciones reales (pesos/centavos, RESTAURAR, caja, etc.)
- [x] Pasos visuales offline (SVG storyboards + soporte GIF/PNG en `/public/help`)

## QA-008 · Usuarios / permisos `[P0]` `doing`

- [x] Vendedor no entra a productos/inventario/usuarios/backups (guards de sección)
- [x] Admin sí
- [x] Vendedor sí entra a Tutorial

---

# Fase 8 — Backups `[P0]`

## BE-016 · BackupService `[P0]` `done`

- [x] Backup manual (copiar archivo SQLite de forma segura)
- [x] Metadata: fecha, path, tamaño
- [x] Restaurar backup (con confirmación destructiva)
- [x] Backup automático (al cerrar caja)
- [x] Mostrar último backup

## FE-014 · Pantalla Backups (admin) `[P0]` `done`

- [x] Botón backup ahora
- [x] Listado / última fecha
- [x] Restaurar con doble confirmación

## QA-009 · Backups `[P0]` `doing`

- [ ] Tras restore, datos coinciden con snapshot
- [x] Backup no corrompe DB abierta (copia de archivo + close antes de restore)
- [x] Fallo de disco muestra error claro

---

# Fase 9 — Empaquetado y hardening

## DX-003 · Build Windows ejecutable `[P0]` `done`

- [x] `tauri build` configurado (bundle NSIS + CI Windows)
- [x] Icono y nombre Argo POS
- [x] Rutas de datos en AppConfig/AppData (plugin-sql + docs)

## DX-004 · Primer arranque / onboarding mínimo `[P1]` `done`

- [x] Crear admin si DB vacía (seed bootstrap)
- [x] Seed métodos de pago
- [x] Mensaje “caja local / sin internet requerido”

## QA-010 · Release checklist `[P0]` `doing`

- [ ] Instalar en PC limpio Windows (usar artifact CI)
- [ ] Flujo completo: login → abrir caja → vender → anular → backup → restore
- [ ] Sin internet durante todo el flujo
- [ ] UPS scenario: reinicio app recupera DB
- [x] Checklist documentado en README

## QA-011 · Performance / touch QA `[P1]`

- [ ] Targets UX ARCHITECTURE (venta &lt; 10 s, acciones locales &lt; 100 ms percibidas)
- [x] Botones usable a dedo (altura mínima en login/POS)
- [x] Sin modales innecesarios en cobro feliz (solo pago/confirmaciones)

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

---

# Épica — Entrega cliente — Catálogo e Inventario `[P0]`

> Objetivo: dejar Catálogo/Inventario listos para el cliente final (sin demos en la app, sin doble alta, UX para dummies).
>
> Fuente de verdad de producto: [ARCHITECTURE.md](./ARCHITECTURE.md) + [MANUAL.md](./MANUAL.md).
>
> Excel con filas de ejemplo `EJ-…` se **conserva** (guía de importación); no forma parte del wipe de la app.

## Fase 1 — Limpiar demos `[P0]` `doing`

- [x] Quitar demos del seed (categorías / productos / inventario de ejemplo)
- [x] Operación admin `CatalogMaintenanceService.wipeCatalogAndInventory` (recetas, productos, inventario, categorías)
- [x] Wipe no toca usuarios, ventas, caja, settings ni métodos de pago
- [ ] UI con doble confirmación
- [x] Tests del wipe

**Criterio de hecho:** app nueva y DB wipeada muestran Catálogo/Inventario/Categorías vacíos.

## Fase 2 — CRUD Inventario `[P0]` `todo`

- [ ] UI Editar ítem (nombre, unidad, mínimo)
- [ ] UI Desactivar / reactivar (soft delete; copy claro)
- [ ] Reglas al desactivar si está ligado a producto/receta activos
- [ ] Tests / checklist manual

**Criterio de hecho:** admin puede corregir y ocultar ítems de bodega sin tocar stock a mano.

## Fase 3 — Alta única Producto Simple `[P0]` `todo`

- [ ] En Catálogo, Simple crea o reutiliza inventario en el mismo flujo
- [ ] Cero doble proceso obligatorio (Inventario + Catálogo) para vender empaquetados
- [ ] Copy dummy: Simple = se vende tal cual
- [ ] Tests service + checklist

**Criterio de hecho:** crear Doritos/Cerveza solo desde Catálogo deja el producto vendible y con stock.

## Fase 4 — Pulido UX de productos compuestos `[P1]` `todo`

- [ ] Copy/wizard Compuesto (granizado) guiado
- [ ] Validación: insumos deben existir en Inventario
- [ ] Receta clara en UI
- [ ] Checklist manual granizado

**Criterio de hecho:** un admin dummy arma un granizado sin confusión con el flujo Simple.
