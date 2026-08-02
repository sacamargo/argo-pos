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

Scripts útiles:

| Script | Uso |
|--------|-----|
| `pnpm dev` | Solo frontend Vite (sin ventana nativa) |
| `pnpm tauri:dev` | App desktop en desarrollo |
| `pnpm tauri:build` | Empaquetado nativo |
| `pnpm typecheck` | TypeScript estricto |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |

## Estructura

Ver árbol en `ARCHITECTURE.md` (`src/app`, `modules`, `domain`, `infrastructure`, `database`, etc.).

El prototipo web histórico (Next.js + Supabase) está en la rama `feature/system-pos-web`.
