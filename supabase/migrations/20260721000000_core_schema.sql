-- Argo POS Core schema (Phase 1)
-- No Future tables: customers, assets, cash_*, suppliers

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'COP',
  timezone text not null default 'America/Bogota',
  locale text not null default 'es-CO',
  inventory_policy text not null default 'block'
    check (inventory_policy in ('block', 'warn', 'allow_negative')),
  default_tax numeric(8, 4) not null default 0,
  address text,
  phone text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id),
  full_name text not null,
  role text not null check (role in ('admin', 'cashier')),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select business_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active = true
  );
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  unique (business_id, name)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  category_id uuid not null references public.categories (id),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  unique (business_id, name)
);

create table public.option_groups (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_required boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  unique (product_id, name)
);

create table public.option_values (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  option_group_id uuid not null references public.option_groups (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  unique (option_group_id, name)
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sku text,
  barcode text,
  sku_label text not null,
  options_hash text not null,
  current_price_id uuid,
  current_recipe_version_id uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  unique (business_id, options_hash),
  unique (business_id, sku),
  unique (business_id, barcode)
);

create table public.variant_option_values (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  option_value_id uuid not null references public.option_values (id),
  unique (variant_id, option_value_id)
);

create table public.variant_prices (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  price numeric(12, 2) not null check (price >= 0),
  valid_from timestamptz not null default timezone('utc', now()),
  valid_to timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

alter table public.product_variants
  add constraint product_variants_current_price_id_fkey
  foreign key (current_price_id) references public.variant_prices (id);

create table public.recipe_versions (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on delete cascade,
  version_number int not null,
  notes text,
  valid_from timestamptz not null default timezone('utc', now()),
  valid_to timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  unique (variant_id, version_number)
);

alter table public.product_variants
  add constraint product_variants_current_recipe_version_id_fkey
  foreign key (current_recipe_version_id) references public.recipe_versions (id);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  unit text not null check (unit in ('ml', 'g', 'unit')),
  stock_qty numeric(14, 4) not null default 0,
  min_stock numeric(14, 4) not null default 0,
  stock_tolerance numeric(14, 4) not null default 0,
  cost_per_unit numeric(14, 6) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  unique (business_id, name)
);

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  recipe_version_id uuid not null references public.recipe_versions (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id),
  qty numeric(14, 4) not null check (qty > 0),
  unique (recipe_version_id, ingredient_id)
);

create table public.inventory_reasons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  code text not null,
  name text not null,
  qty_sign smallint not null check (qty_sign in (-1, 0, 1)),
  is_active boolean not null default true,
  unique (business_id, code)
);

create table public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  code text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id),
  updated_by uuid references public.profiles (id),
  unique (business_id, code)
);

create table public.sale_sequences (
  business_id uuid primary key references public.businesses (id) on delete cascade,
  last_value bigint not null default 0
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  public_id text not null,
  business_id uuid not null references public.businesses (id),
  user_id uuid not null references public.profiles (id),
  payment_method_id uuid not null references public.payment_methods (id),
  status text not null default 'completed'
    check (status in ('completed', 'reversed')),
  total numeric(12, 2) not null check (total >= 0),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references public.profiles (id),
  unique (business_id, public_id)
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id),
  variant_id uuid not null references public.product_variants (id),
  recipe_version_id uuid not null references public.recipe_versions (id),
  product_name text not null,
  options_snapshot jsonb not null default '[]'::jsonb,
  unit_price numeric(12, 2) not null,
  quantity int not null check (quantity > 0),
  line_total numeric(12, 2) not null
);

create table public.sale_reversals (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  sale_id uuid not null references public.sales (id),
  reason text not null,
  reversal_type text not null check (reversal_type in ('cancel', 'refund')),
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid not null references public.profiles (id),
  unique (sale_id)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id),
  ingredient_id uuid not null references public.ingredients (id),
  reason_id uuid not null references public.inventory_reasons (id),
  qty numeric(14, 4) not null,
  stock_after numeric(14, 4) not null,
  sale_id uuid references public.sales (id),
  sale_reversal_id uuid references public.sale_reversals (id),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  created_by uuid references public.profiles (id)
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index sales_business_created_idx on public.sales (business_id, created_at desc);
create index sale_items_sale_idx on public.sale_items (sale_id);
create index inventory_movements_ingredient_created_idx
  on public.inventory_movements (ingredient_id, created_at desc);
create index ingredients_business_stock_idx on public.ingredients (business_id, stock_qty);
create index product_variants_product_idx on public.product_variants (product_id);

-- ---------------------------------------------------------------------------
-- Stock cache trigger (movements = source of truth)
-- ---------------------------------------------------------------------------

create or replace function public.apply_inventory_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_stock numeric(14, 4);
begin
  update public.ingredients
  set stock_qty = stock_qty + new.qty,
      updated_at = timezone('utc', now())
  where id = new.ingredient_id
  returning stock_qty into new_stock;

  new.stock_after := new_stock;
  return new;
end;
$$;

create trigger inventory_movements_apply_stock
before insert on public.inventory_movements
for each row
execute function public.apply_inventory_movement();

create trigger businesses_set_updated_at
before update on public.businesses
for each row execute function public.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create trigger ingredients_set_updated_at
before update on public.ingredients
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auth profile bootstrap (role assigned by seed/admin; default cashier)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_business uuid;
begin
  select id into default_business from public.businesses order by created_at limit 1;

  if default_business is null then
    return new;
  end if;

  insert into public.profiles (id, business_id, full_name, role)
  values (
    new.id,
    default_business,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'cashier')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- create_sale RPC
-- ---------------------------------------------------------------------------

create or replace function public.create_sale(
  p_payment_method_id uuid,
  p_notes text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_business public.businesses;
  v_sale_id uuid;
  v_public_id text;
  v_seq bigint;
  v_total numeric(12, 2) := 0;
  v_item jsonb;
  v_variant public.product_variants;
  v_price public.variant_prices;
  v_recipe public.recipe_versions;
  v_qty int;
  v_line_total numeric(12, 2);
  v_options jsonb;
  v_recipe_item record;
  v_required numeric(14, 4);
  v_reason_sale uuid;
  v_payment public.payment_methods;
begin
  select * into v_profile from public.profiles where id = auth.uid() and is_active = true;
  if v_profile.id is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select * into v_business from public.businesses where id = v_profile.business_id;
  if v_business.id is null then
    raise exception 'BUSINESS_NOT_FOUND';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  select * into v_payment
  from public.payment_methods
  where id = p_payment_method_id
    and business_id = v_profile.business_id
    and is_active = true;

  if v_payment.id is null then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;

  select id into v_reason_sale
  from public.inventory_reasons
  where business_id = v_profile.business_id and code = 'sale' and is_active = true
  limit 1;

  if v_reason_sale is null then
    raise exception 'MISSING_SALE_REASON';
  end if;

  -- Validate stock and compute total
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'INVALID_QUANTITY';
    end if;

    select * into v_variant
    from public.product_variants
    where id = (v_item->>'variant_id')::uuid
      and business_id = v_profile.business_id
      and is_active = true;

    if v_variant.id is null then
      raise exception 'INVALID_VARIANT';
    end if;

    if v_variant.current_price_id is null or v_variant.current_recipe_version_id is null then
      raise exception 'VARIANT_NOT_READY';
    end if;

    select * into v_price from public.variant_prices where id = v_variant.current_price_id;
    select * into v_recipe from public.recipe_versions where id = v_variant.current_recipe_version_id;

    v_total := v_total + (v_price.price * v_qty);

    for v_recipe_item in
      select ri.ingredient_id, ri.qty, i.stock_qty, i.stock_tolerance, i.name
      from public.recipe_items ri
      join public.ingredients i on i.id = ri.ingredient_id
      where ri.recipe_version_id = v_recipe.id
    loop
      v_required := v_recipe_item.qty * v_qty;

      if v_business.inventory_policy = 'block' then
        if v_recipe_item.stock_qty <= 0 then
          raise exception 'INSUFFICIENT_STOCK:%', v_recipe_item.name;
        end if;
        if v_required > (v_recipe_item.stock_qty + v_recipe_item.stock_tolerance) then
          raise exception 'INSUFFICIENT_STOCK:%', v_recipe_item.name;
        end if;
      end if;
    end loop;
  end loop;

  insert into public.sale_sequences (business_id, last_value)
  values (v_profile.business_id, 1)
  on conflict (business_id)
  do update set last_value = public.sale_sequences.last_value + 1
  returning last_value into v_seq;

  v_public_id := 'SALE-' || lpad(v_seq::text, 6, '0');
  v_sale_id := gen_random_uuid();

  insert into public.sales (
    id, public_id, business_id, user_id, payment_method_id, status, total, notes, created_by
  ) values (
    v_sale_id, v_public_id, v_profile.business_id, v_profile.id, v_payment.id,
    'completed', v_total, nullif(trim(coalesce(p_notes, '')), ''), v_profile.id
  );

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (v_item->>'quantity')::int;

    select * into v_variant
    from public.product_variants
    where id = (v_item->>'variant_id')::uuid;

    select * into v_price from public.variant_prices where id = v_variant.current_price_id;
    select * into v_recipe from public.recipe_versions where id = v_variant.current_recipe_version_id;

    select coalesce(jsonb_agg(
      jsonb_build_object('group', og.name, 'value', ov.name)
      order by og.sort_order
    ), '[]'::jsonb)
    into v_options
    from public.variant_option_values vov
    join public.option_values ov on ov.id = vov.option_value_id
    join public.option_groups og on og.id = ov.option_group_id
    where vov.variant_id = v_variant.id;

    v_line_total := v_price.price * v_qty;

    insert into public.sale_items (
      sale_id, variant_id, recipe_version_id, product_name, options_snapshot,
      unit_price, quantity, line_total
    )
    select
      v_sale_id,
      v_variant.id,
      v_recipe.id,
      p.name,
      v_options,
      v_price.price,
      v_qty,
      v_line_total
    from public.products p
    where p.id = v_variant.product_id;

    for v_recipe_item in
      select ri.ingredient_id, ri.qty
      from public.recipe_items ri
      where ri.recipe_version_id = v_recipe.id
    loop
      insert into public.inventory_movements (
        business_id, ingredient_id, reason_id, qty, stock_after, sale_id, created_by
      ) values (
        v_profile.business_id,
        v_recipe_item.ingredient_id,
        v_reason_sale,
        -(v_recipe_item.qty * v_qty),
        0,
        v_sale_id,
        v_profile.id
      );
    end loop;
  end loop;

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'public_id', v_public_id,
    'total', v_total
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- reverse_sale RPC
-- ---------------------------------------------------------------------------

create or replace function public.reverse_sale(
  p_sale_id uuid,
  p_reason text,
  p_reversal_type text default 'cancel'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_sale public.sales;
  v_reversal_id uuid;
  v_reason_reversal uuid;
  v_move record;
begin
  if not public.is_admin() then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_profile from public.profiles where id = auth.uid();

  select * into v_sale
  from public.sales
  where id = p_sale_id and business_id = v_profile.business_id;

  if v_sale.id is null then
    raise exception 'SALE_NOT_FOUND';
  end if;

  if v_sale.status <> 'completed' then
    raise exception 'SALE_NOT_REVERSIBLE';
  end if;

  select id into v_reason_reversal
  from public.inventory_reasons
  where business_id = v_profile.business_id and code = 'reversal' and is_active = true
  limit 1;

  if v_reason_reversal is null then
    raise exception 'MISSING_REVERSAL_REASON';
  end if;

  insert into public.sale_reversals (
    business_id, sale_id, reason, reversal_type, created_by
  ) values (
    v_profile.business_id, v_sale.id, p_reason, p_reversal_type, v_profile.id
  )
  returning id into v_reversal_id;

  for v_move in
    select ingredient_id, qty
    from public.inventory_movements
    where sale_id = v_sale.id
  loop
    insert into public.inventory_movements (
      business_id, ingredient_id, reason_id, qty, stock_after,
      sale_id, sale_reversal_id, created_by, notes
    ) values (
      v_profile.business_id,
      v_move.ingredient_id,
      v_reason_reversal,
      -v_move.qty,
      0,
      v_sale.id,
      v_reversal_id,
      v_profile.id,
      'Reversal of sale ' || v_sale.public_id
    );
  end loop;

  update public.sales
  set status = 'reversed'
  where id = v_sale.id;

  return jsonb_build_object('sale_id', v_sale.id, 'reversal_id', v_reversal_id);
end;
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.option_groups enable row level security;
alter table public.option_values enable row level security;
alter table public.product_variants enable row level security;
alter table public.variant_option_values enable row level security;
alter table public.variant_prices enable row level security;
alter table public.recipe_versions enable row level security;
alter table public.recipe_items enable row level security;
alter table public.ingredients enable row level security;
alter table public.inventory_reasons enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.payment_methods enable row level security;
alter table public.sale_sequences enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.sale_reversals enable row level security;

create policy businesses_select on public.businesses for select
  using (id = public.current_business_id());

create policy profiles_select on public.profiles for select
  using (business_id = public.current_business_id());

create policy profiles_update_self on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- Generic business-scoped read for catalog/inventory/sales
create policy categories_select on public.categories for select
  using (business_id = public.current_business_id());
create policy categories_write on public.categories for all
  using (public.is_admin() and business_id = public.current_business_id())
  with check (public.is_admin() and business_id = public.current_business_id());

create policy products_select on public.products for select
  using (business_id = public.current_business_id());
create policy products_write on public.products for all
  using (public.is_admin() and business_id = public.current_business_id())
  with check (public.is_admin() and business_id = public.current_business_id());

create policy option_groups_select on public.option_groups for select
  using (business_id = public.current_business_id());
create policy option_groups_write on public.option_groups for all
  using (public.is_admin() and business_id = public.current_business_id())
  with check (public.is_admin() and business_id = public.current_business_id());

create policy option_values_select on public.option_values for select
  using (business_id = public.current_business_id());
create policy option_values_write on public.option_values for all
  using (public.is_admin() and business_id = public.current_business_id())
  with check (public.is_admin() and business_id = public.current_business_id());

create policy product_variants_select on public.product_variants for select
  using (business_id = public.current_business_id());
create policy product_variants_write on public.product_variants for all
  using (public.is_admin() and business_id = public.current_business_id())
  with check (public.is_admin() and business_id = public.current_business_id());

create policy variant_option_values_select on public.variant_option_values for select
  using (
    exists (
      select 1 from public.product_variants pv
      where pv.id = variant_id and pv.business_id = public.current_business_id()
    )
  );
create policy variant_option_values_write on public.variant_option_values for all
  using (
    public.is_admin() and exists (
      select 1 from public.product_variants pv
      where pv.id = variant_id and pv.business_id = public.current_business_id()
    )
  )
  with check (
    public.is_admin() and exists (
      select 1 from public.product_variants pv
      where pv.id = variant_id and pv.business_id = public.current_business_id()
    )
  );

create policy variant_prices_select on public.variant_prices for select
  using (
    exists (
      select 1 from public.product_variants pv
      where pv.id = variant_id and pv.business_id = public.current_business_id()
    )
  );
create policy variant_prices_write on public.variant_prices for all
  using (
    public.is_admin() and exists (
      select 1 from public.product_variants pv
      where pv.id = variant_id and pv.business_id = public.current_business_id()
    )
  )
  with check (
    public.is_admin() and exists (
      select 1 from public.product_variants pv
      where pv.id = variant_id and pv.business_id = public.current_business_id()
    )
  );

create policy recipe_versions_select on public.recipe_versions for select
  using (
    exists (
      select 1 from public.product_variants pv
      where pv.id = variant_id and pv.business_id = public.current_business_id()
    )
  );
create policy recipe_versions_write on public.recipe_versions for all
  using (
    public.is_admin() and exists (
      select 1 from public.product_variants pv
      where pv.id = variant_id and pv.business_id = public.current_business_id()
    )
  )
  with check (
    public.is_admin() and exists (
      select 1 from public.product_variants pv
      where pv.id = variant_id and pv.business_id = public.current_business_id()
    )
  );

create policy recipe_items_select on public.recipe_items for select
  using (
    exists (
      select 1 from public.recipe_versions rv
      join public.product_variants pv on pv.id = rv.variant_id
      where rv.id = recipe_version_id and pv.business_id = public.current_business_id()
    )
  );
create policy recipe_items_write on public.recipe_items for all
  using (
    public.is_admin() and exists (
      select 1 from public.recipe_versions rv
      join public.product_variants pv on pv.id = rv.variant_id
      where rv.id = recipe_version_id and pv.business_id = public.current_business_id()
    )
  )
  with check (
    public.is_admin() and exists (
      select 1 from public.recipe_versions rv
      join public.product_variants pv on pv.id = rv.variant_id
      where rv.id = recipe_version_id and pv.business_id = public.current_business_id()
    )
  );

create policy ingredients_select on public.ingredients for select
  using (business_id = public.current_business_id());
create policy ingredients_write on public.ingredients for all
  using (public.is_admin() and business_id = public.current_business_id())
  with check (public.is_admin() and business_id = public.current_business_id());

create policy inventory_reasons_select on public.inventory_reasons for select
  using (business_id = public.current_business_id());
create policy inventory_reasons_write on public.inventory_reasons for all
  using (public.is_admin() and business_id = public.current_business_id())
  with check (public.is_admin() and business_id = public.current_business_id());

create policy inventory_movements_select on public.inventory_movements for select
  using (business_id = public.current_business_id());
create policy inventory_movements_insert on public.inventory_movements for insert
  with check (public.is_admin() and business_id = public.current_business_id());

create policy payment_methods_select on public.payment_methods for select
  using (business_id = public.current_business_id());
create policy payment_methods_write on public.payment_methods for all
  using (public.is_admin() and business_id = public.current_business_id())
  with check (public.is_admin() and business_id = public.current_business_id());

create policy sales_select on public.sales for select
  using (business_id = public.current_business_id());
create policy sales_insert on public.sales for insert
  with check (
    business_id = public.current_business_id()
    and created_by = auth.uid()
  );

create policy sale_items_select on public.sale_items for select
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id and s.business_id = public.current_business_id()
    )
  );
create policy sale_items_insert on public.sale_items for insert
  with check (
    exists (
      select 1 from public.sales s
      where s.id = sale_id and s.business_id = public.current_business_id()
    )
  );

create policy sale_reversals_select on public.sale_reversals for select
  using (business_id = public.current_business_id());
create policy sale_reversals_insert on public.sale_reversals for insert
  with check (public.is_admin() and business_id = public.current_business_id());

create policy sale_sequences_select on public.sale_sequences for select
  using (business_id = public.current_business_id());

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.create_sale(uuid, text, jsonb) to authenticated;
grant execute on function public.reverse_sale(uuid, text, text) to authenticated;
