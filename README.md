# Argo POS

> **Argo POS existe para que cualquier negocio pueda registrar una venta en menos de 10 segundos, conocer su inventario en tiempo real y tomar decisiones con datos, sin necesidad de aprender a usar un software complejo.**

Sistema web POS para pequeños negocios de alimentos y bebidas. El primer cliente de validación es una tienda de granizados; el producto está diseñado para adaptarse a cafeterías, heladerías y comercios similares.

## Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS v4 + design system propio
- Supabase (Postgres, Auth, RLS)
- Zod + React Hook Form

## Principios

Ver [PRODUCT_PRINCIPLES.md](./PRODUCT_PRINCIPLES.md) y [ROADMAP.md](./ROADMAP.md).

## Arranque local

```bash
pnpm install
cp .env.example .env.local
# Completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
pnpm dev
```

Aplica las migraciones en `supabase/migrations` desde el SQL Editor de Supabase o con la CLI.

Guía paso a paso: [SETUP.md](./SETUP.md).

## Scripts

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Arquitectura

```text
UI → Service → (Repository si CRUD/queries complejas) → Supabase / RPC
```

Módulos: `core`, `pos`, `catalog`, `inventory`, `analytics`, `auth`, `dashboard`, `shared`.

**KPI:** una venta confirmada debe resolverse en &lt; 500 ms (cliente → RPC → OK).
