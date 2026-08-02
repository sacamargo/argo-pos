-- Phase 1 completion: roles master/admin/cashier, cash tender fields, staff manager RLS

-- ---------------------------------------------------------------------------
-- Roles: add master
-- ---------------------------------------------------------------------------

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('master', 'admin', 'cashier'));

-- Keep is_admin() for backwards compatibility (admin OR master for write ops)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('master', 'admin')
      and is_active = true
  );
$$;

create or replace function public.is_staff_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin();
$$;

create or replace function public.is_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'master'
      and is_active = true
  );
$$;

-- ---------------------------------------------------------------------------
-- Cash tender columns on sales
-- ---------------------------------------------------------------------------

alter table public.sales
  add column if not exists amount_tendered numeric(12, 2),
  add column if not exists change_amount numeric(12, 2);

-- ---------------------------------------------------------------------------
-- create_sale: accept cash tender amounts
-- ---------------------------------------------------------------------------

drop function if exists public.create_sale(uuid, text, jsonb);

create or replace function public.create_sale(
  p_payment_method_id uuid,
  p_notes text,
  p_items jsonb,
  p_amount_tendered numeric default null,
  p_change_amount numeric default null
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
  v_amount_tendered numeric(12, 2);
  v_change_amount numeric(12, 2);
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

  v_amount_tendered := null;
  v_change_amount := null;

  if v_payment.code = 'cash' then
    if p_amount_tendered is null then
      raise exception 'AMOUNT_TENDERED_REQUIRED';
    end if;
    if p_amount_tendered < v_total then
      raise exception 'INSUFFICIENT_TENDER';
    end if;
    v_amount_tendered := p_amount_tendered;
    v_change_amount := coalesce(p_change_amount, p_amount_tendered - v_total);
  end if;

  insert into public.sale_sequences (business_id, last_value)
  values (v_profile.business_id, 1)
  on conflict (business_id)
  do update set last_value = public.sale_sequences.last_value + 1
  returning last_value into v_seq;

  v_public_id := 'SALE-' || lpad(v_seq::text, 6, '0');
  v_sale_id := gen_random_uuid();

  insert into public.sales (
    id, public_id, business_id, user_id, payment_method_id, status, total, notes,
    amount_tendered, change_amount, created_by
  ) values (
    v_sale_id, v_public_id, v_profile.business_id, v_profile.id, v_payment.id,
    'completed', v_total, nullif(trim(coalesce(p_notes, '')), ''),
    v_amount_tendered, v_change_amount, v_profile.id
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
    'total', v_total,
    'change_amount', v_change_amount
  );
end;
$$;

-- reverse_sale already uses is_admin() which now includes master

grant execute on function public.create_sale(uuid, text, jsonb, numeric, numeric) to authenticated;

-- Profiles: master can update other profiles in same business
drop policy if exists profiles_update_self on public.profiles;

create policy profiles_update_self on public.profiles for update
  using (
    id = auth.uid()
    or (public.is_master() and business_id = public.current_business_id())
  )
  with check (
    id = auth.uid()
    or (public.is_master() and business_id = public.current_business_id())
  );

create policy profiles_insert_master on public.profiles for insert
  with check (
    public.is_master() and business_id = public.current_business_id()
  );
