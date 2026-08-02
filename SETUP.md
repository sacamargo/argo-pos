# Setup checklist — Argo POS

1. Proyecto Supabase creado.
2. Variables en `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. Ejecuta en el SQL Editor, en orden:
   - `supabase/migrations/20260721000000_core_schema.sql`
   - `supabase/migrations/20260721000001_seed_demo.sql`
   - `supabase/migrations/20260721000002_phase1_roles_cash.sql`
4. Crea un usuario en Authentication (email/password, mín. 6 caracteres).
5. Vincula el profile como **master** del negocio demo:

```sql
insert into public.profiles (id, business_id, full_name, role, is_active)
values (
  '<USER_UUID>',
  '11111111-1111-1111-1111-111111111111',
  'Master Demo',
  'master',
  true
)
on conflict (id) do update
set role = 'master',
    business_id = excluded.business_id,
    full_name = excluded.full_name,
    is_active = true;
```

6. `pnpm dev` → `/login` → `/pos`

## Roles

| Rol | Acceso |
|-----|--------|
| `master` | Todo + Usuarios |
| `admin` | POS, dashboard, ventas, catálogo, inventario |
| `cashier` | POS, dashboard básico, historial/detalle de ventas |

Para agregar vendedores: créalos en Authentication, luego en `/users` (master) pega el UUID y asígnales rol.

Los clients viven en `src/lib/supabase/`.
