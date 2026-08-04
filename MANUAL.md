# MANUAL.md — Manual de desarrollo Argo POS

> Contexto operativo permanente del proyecto.
>
> Léelo antes de escribir código, abrir una rama o aceptar un cambio de alcance.
>
> Fuentes de verdad: [ARCHITECTURE.md](./ARCHITECTURE.md) · [GIT-FLOW.md](./GIT-FLOW.md) · [TASK.md](./TASK.md)

---

## 1. Qué estamos construyendo

**Argo POS** es un punto de venta **local-first**, **offline-first** y **touch-first** para pequeños negocios (granizados, cafeterías, panaderías, etc.).

No es un ERP. No es Odoo. No es “un sistema con 40 módulos”.

Es un producto que debe aprenderse en **&lt; 5 minutos** y permitir vender en **&lt; 10 segundos**.

### Frase filtro

> Si esto no ayuda a vender más rápido, conocer el inventario o no perder una venta cuando no hay internet… no entra al MVP.

---

## 2. Principios no negociables (checklist mental)

Antes de cada PR, verifica:

1. **Offline first** — la venta nunca depende de un servidor ni de internet.
2. **Local first** — SQLite en el PC del negocio es la fuente de verdad.
3. **Touch first** — botones grandes, pocas acciones, usable con el dedo.
4. **Venta &lt; 10 s** — cada clic debe justificarse.
5. **Minimalismo** — nada “por si acaso”.
6. **Ventas inmutables** — no UPDATE de ventas; solo anulación con motivo + reversión de inventario.
7. **Inventario por movimientos** — nunca editar stock a mano sin movimiento.

Si un cambio viola uno de estos, se rechaza o se rediseña.

---

## 3. Stack oficial (no improvisar)

| Capa | Tecnología |
|------|------------|
| UI | React + TypeScript + Vite + Tailwind + shadcn + RHF + Zod |
| Desktop | Tauri v2 |
| DB | SQLite |
| ORM | Drizzle |
| Estado UI | Zustand (solo UI; nunca fuente de verdad de negocio) |
| Package manager | pnpm |
| Tests | Vitest (+ Playwright cuando exista E2E) |

Prohibido sin decisión explícita de tech-lead:

- Supabase / Firebase / API cloud como dependencia de caja
- `any` / `@ts-ignore`
- Acceso a Drizzle/SQLite/Tauri desde componentes React
- Meter lógica de negocio en Zustand

---

## 4. Arquitectura de capas (obligatoria)

```text
UI (modules/*/components, pages)
  → Application services
    → Domain (entities, rules, repository ports)
      → Infrastructure (Drizzle repos, SQLite, Tauri FS)
        → SQLite file
```

### Reglas

- La **UI** llama servicios de aplicación. Nada más.
- El **Domain** no conoce React, Drizzle ni Tauri.
- La **Infrastructure** implementa puertos del domain.
- Toda mutación importante pasa por un **service** con validación Zod.
- Operaciones de venta/inventario van en **transacción**.

### Anti-patrones

- `import { db } from '@/database'` dentro de un componente
- Calcular totales de venta solo en el cliente sin validar en service
- “Resolver rápido” rompiendo capas “y luego refactorizamos”

---

## 5. Roles del equipo (cómo pensar en este repo)

Este proyecto se desarrolla como si una sola persona (o AI pair) ejerciera **todos** estos roles. En cada decisión, cambia el sombrero correcto.

### 5.1 Product Owner

**Pregunta:** ¿Esto aporta valor inmediato al negocio en caja?

- Prioriza MVP de [TASK.md](./TASK.md).
- Dice no a facturación DIAN, impresoras, multi-sucursal, sync nube, etc. (ver “Fuera del MVP” en ARCHITECTURE).
- Define el criterio de aceptación en lenguaje de negocio (“el vendedor cobra efectivo con cambio sin internet”).

### 5.2 Product Engineer

**Pregunta:** ¿La solución es la más simple que cumple el principio?

- Traduce historias a tareas FE/BE/QA pequeñas.
- Evita over-engineering (no microservicios, no event bus, no sync framework prematuro).
- Cuida la experiencia end-to-end del flujo feliz de venta.

### 5.3 Tech Lead

**Pregunta:** ¿Esto es mantenible en 12 meses?

- Enforza GIT-FLOW, capas y TypeScript estricto.
- Decide stack exceptions (casi nunca).
- Revisa PRs: arquitectura, riesgos de datos, permisos, backups.
- Bloquea merges que rompan `main` o el offline-first.

### 5.4 Architect

**Pregunta:** ¿Dónde vive esta responsabilidad?

- Mantiene límites UI / Application / Domain / Infrastructure.
- Diseña el modelo de datos para crecer (sync futura) **sin** implementarla ahora.
- Garantiza: ventas inmutables, movimientos de inventario, sesiones de caja, backups.

### 5.5 Specialist Frontend

**Pregunta:** ¿Se puede usar con una mano en tablet?

- Layout POS: categorías | grid | carrito permanente.
- Una acción principal por pantalla.
- Feedback &lt; 100 ms percibidos en acciones locales.
- Temas claro/oscuro; Inter + Lucide; sin ruido visual tipo ERP.
- Zustand solo para UI (carrito en memoria de pantalla, theme, modales).

### 5.6 Specialist Backend (local)

**Pregunta:** ¿La transacción es correcta si se va la luz a mitad?

- SQLite + Drizzle migrations.
- Services transaccionales (`createSale`, `reverseSale`, movimientos).
- Passwords hasheados.
- Paths de datos en directorio de la app (Tauri), no relativos frágiles.
- Performance local: cobro confiable y rápido.

### 5.7 Specialist Tester / QA

**Pregunta:** ¿Cómo se rompe esto en el local real?

- Pirámide: unit (domain/cart) → service (DB temp) → E2E crítico → checklist release.
- Casos offline obligatorios.
- Casos de doble submit, stock insuficiente, caja cerrada, anulación, restore backup.
- Regresión de permisos admin vs vendedor.
- Definition of Done incluye QA, no solo “compila”.

### 5.8 Full-stack (modo default del agente/dev)

Cuando implementes una feature:

1. PO: confirma que está en TASK/MVP.
2. Architect: ubica la capa.
3. BE: service + schema/migración si aplica.
4. FE: UI táctil vía services.
5. QA: tests o checklist mínimos de la tarea.
6. Tech lead: PR atómico según GIT-FLOW.

---

## 6. Git (resumen operativo)

Detalle completo en [GIT-FLOW.md](./GIT-FLOW.md).

- Nunca commits directos a `main`.
- Una rama = una responsabilidad.
- Commits: `tipo(scope): descripción` (`feat|fix|refactor|style|docs|test|chore`).
- PR siempre; borrar rama tras merge.
- Preferir muchos commits pequeños.

Ramas típicas MVP:

```text
feature/pos-cart
feature/sale-service
feature/cash-session
fix/change-calculator
docs/task-and-manual
```

---

## 7. Módulos del MVP (mapa mental)

| Módulo | Responsabilidad | Quién usa |
|--------|-----------------|-----------|
| `pos` | Vender | Admin + Vendedor |
| `dashboard` | Indicadores del día | Ambos (vendedor reducido) |
| `catalog` | Productos + categorías | Admin |
| `inventory` | Ingredientes + movimientos | Admin |
| `users` | Cuentas y roles | Admin |
| `settings` | Tema / datos negocio | Admin |
| `backup` | Backup / restore | Admin |
| caja (`cash_sessions`) | Apertura/cierre | Según regla MVP (ambos típico) |

### Roles de producto (app)

- **Admin:** acceso completo.
- **Vendedor:** ventas / historial / dashboard básico (sin catálogo, inventario, usuarios, backups).

---

## 8. Reglas de dominio críticas

### Ventas

- Insert only para montos/ítems.
- Anulación crea `sale_reversal` + movimientos inversos.
- Snapshots de nombre/precio en `sale_items`.
- Efectivo: registrar recibido y cambio; no confirmar si recibido &lt; total.

### Inventario

- Stock solo cambia por `inventory_movements`.
- Venta descuenta según receta del producto.
- Anulación reintegra.

### Caja

- Debe existir sesión abierta para cobrar (MVP).
- Apertura y cierre quedan auditados.

### Backups

- Copiar DB de forma segura.
- Restore es acción destructiva: doble confirmación.
- Último backup visible en UI.

---

## 9. UX — Definition of Ready para UI

Una pantalla está lista para implementar solo si:

- Tiene **una** pregunta que responde.
- Tiene **una** acción primaria clara.
- Es usable en touch (targets grandes).
- No requiere capacitación.
- Estados vacíos / error / loading están definidos.
- No introduce módulos fuera de TASK.

### POS específico

- Carrito **siempre** visible.
- Tarjeta de producto: imagen + nombre + precio (nada más).
- Cobrar es el CTA dominante.
- Evitar modales excepto pago/confirmaciones destructivas.

La sección **Tutorial** (FE-015) es guía opcional de capacitación; las pantallas operativas siguen debiendo usarse sin depender de ella.

---

## 10. QA — Definition of Done

Una tarea no está `done` sin:

- [ ] Cumple criterio de [TASK.md](./TASK.md)
- [ ] TypeScript strict limpio
- [ ] Lint limpio
- [ ] Sin `any` / sin logs de debug
- [ ] UI no rompe capas
- [ ] Tests automatizados donde aplica (domain/service)
- [ ] Checklist manual del flujo afectado
- [ ] Offline verificado si toca ventas/datos
- [ ] Commit(s) atómicos + PR

### Matriz mínima de QA por release MVP

| Flujo | Offline | Admin | Vendedor |
|-------|---------|-------|----------|
| Login | sí | sí | sí |
| Abrir caja → vender efectivo → cambio | sí | sí | sí |
| Anular venta → stock vuelve | sí | sí | según permiso |
| Crear producto + receta → aparece en POS | sí | sí | n/a |
| Entrada inventario | sí | sí | n/a |
| Backup → restore | sí | sí | n/a |
| Permisos (vendedor bloqueado de admin) | sí | — | sí |

---

## 11. Cómo usar este manual con AI / pair programming

Al pedir trabajo al agente o a un compañero, incluye:

1. Enlace o cita a ARCHITECTURE + TASK id (`FE-007`, `BE-011`, …)
2. Rol activo: “actúa como specialist-front + QA”
3. Restricción: “no uses red; no toques sync nube”
4. Criterio de hecho de la tarea

Si el agente propone algo fuera de MVP: **detener** y mover a `future/`.

---

## 12. Decisiones ya tomadas (no reabrir)

| Tema | Decisión |
|------|----------|
| Runtime | Tauri v2 + React, no Next/Supabase cloud |
| DB | SQLite local |
| ORM | Drizzle |
| Fuente de verdad | Archivo SQLite del negocio |
| Internet | Opcional; nunca bloquea venta |
| Ventas | Inmutables |
| Inventario | Por movimientos + recetas |
| Roles app | Admin / Vendedor |
| Sync nube / multi-sucursal | Futuro explícito |
| Prototipo web anterior | Rama `feature/system-pos-web` (archivo histórico, no base) |

Reabrir estas decisiones solo con tech-lead + product owner y motivo de negocio real.

---

## 13. Señales de que nos estamos desviando

- “Metamos sync ya para probar en el celular”
- “Hagamos proveedores aunque el cliente no lo pidió”
- “Dejamos el carrito oculto en mobile web”
- “Editamos la venta porque anular es más trabajo”
- “Conectemos Supabase otra vez solo para auth”
- Rama con login+pos+inventario+ui+refactor juntos
- Commit `final-final-update`

Cualquiera de estas = stop + volver a este manual.

---

## 14. Objetivo de calidad del producto

El usuario final debe sentir:

**Rapidez · Calidad · Confiabilidad · Simplicidad**

El software debe desaparecer. El negocio debe vender.

---

## 15. Lectura obligatoria por tipo de trabajo

| Vas a… | Lee primero |
|--------|-------------|
| Empezar el repo / scaffold | ARCHITECTURE § Stack + Estructura · TASK Fase 0 |
| Tocar POS | ARCHITECTURE § POS · MANUAL §8–9 · TASK Fase 5 |
| Tocar datos/schema | ARCHITECTURE principios 6–7 · MANUAL §4 y §8 |
| Armar PR | GIT-FLOW · MANUAL §10 |
| Pedido del cliente nuevo | MANUAL §2 y §12 · Fuera del MVP |

---

*Última alineación: derivado de ARCHITECTURE.md (local-first / Tauri / SQLite). Si ARCHITECTURE cambia, actualizar TASK.md y este MANUAL en la misma PR de docs.*
