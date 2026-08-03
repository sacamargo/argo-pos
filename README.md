# Argo POS

POS local-first (Tauri + React + SQLite). Offline-first. Touch-first.

Documentación de producto:

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [TASK.md](./TASK.md)
- [MANUAL.md](./MANUAL.md)
- [GIT-FLOW.md](./GIT-FLOW.md)

## Requisitos

- Node.js ≥ 20 (LTS recomendado)
- pnpm 9
- Rust stable vía [rustup](https://rustup.rs/) (`rustc`, `cargo`)
- macOS: Xcode Command Line Tools

El toolchain de Rust vive en tu usuario (`~/.cargo`). El proyecto fija la canal con `rust-toolchain.toml`.

## Arranque

```bash
pnpm install
pnpm tauri:dev
```

La base SQLite (`argo-pos.db`) se crea sola en el directorio de datos de la app:

- macOS: `~/Library/Application Support/com.argo.pos/`
- Windows: `%APPDATA%\com.argo.pos\` (AppData Roaming)

Backups: subcarpeta `backups/` dentro de ese mismo directorio. Nunca se escribe la DB junto al `.exe`.

Migraciones corren al iniciar.

## Empaquetado

```bash
pnpm tauri:build
```

- En macOS genera `.app` (validación local del bundle). El `.dmg` es opcional y puede fallar en entornos headless.
- El instalador Windows (NSIS/MSI) se genera en CI: workflow `.github/workflows/build-windows.yml` (`workflow_dispatch` o tag `v*`).

## Checklist de release (QA-010)

1. Instalar en PC limpio (Windows preferido)
2. Login admin → crear producto/categoría/ingrediente
3. Abrir caja → vender efectivo con cambio **sin internet**
4. Ver historial → anular venta (stock vuelve)
5. Backup manual → restaurar → reinicio recupera datos
6. Login vendedor: POS + historial; sin catálogo/inventario/usuarios/backup

Precios se guardan en **centavos enteros** (`price_cents`) para evitar errores de redondeo.

Seed inicial (solo primer arranque / seed core):

- admin / `admin123`
- vendedor / `vendedor123`
- métodos de pago, categorías, motivos de inventario
- producto demo `Granizado limón` + ingrediente `Base limón`
| Script | Uso |
|--------|-----|
| `pnpm dev` | Solo frontend Vite (sin ventana nativa / sin SQLite) |
| `pnpm tauri:dev` | App desktop en desarrollo |
| `pnpm tauri:build` | Empaquetado nativo |
| `pnpm typecheck` | TypeScript estricto |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm db:generate` | Generar migraciones Drizzle desde el schema |
| `pnpm test` | Vitest (unitarios) |

## Estructura

Ver árbol en `ARCHITECTURE.md` (`src/app`, `modules`, `domain`, `infrastructure`, `database`, etc.).

El prototipo web histórico (Next.js + Supabase) está en la rama `feature/system-pos-web`.
