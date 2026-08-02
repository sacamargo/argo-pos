-- Seed demo business: tienda de granizados
-- Run after core schema. Create auth users in Supabase Auth, then link profiles.

do $$
declare
  v_business_id uuid := '11111111-1111-1111-1111-111111111111';
  v_category_id uuid := '22222222-2222-2222-2222-222222222201';
  v_product_id uuid := '22222222-2222-2222-2222-222222222202';
  v_group_size uuid := '33333333-3333-3333-3333-333333333301';
  v_group_flavor uuid := '33333333-3333-3333-3333-333333333302';
  v_size_s uuid := '44444444-4444-4444-4444-444444444401';
  v_size_m uuid := '44444444-4444-4444-4444-444444444402';
  v_size_l uuid := '44444444-4444-4444-4444-444444444403';
  v_size_xl uuid := '44444444-4444-4444-4444-444444444404';
  v_flavor_chicle uuid := '55555555-5555-5555-5555-555555555501';
  v_flavor_mora uuid := '55555555-5555-5555-5555-555555555502';
  v_flavor_fresa uuid := '55555555-5555-5555-5555-555555555503';
  v_ing_vaso_s uuid := '66666666-6666-6666-6666-666666666601';
  v_ing_vaso_m uuid := '66666666-6666-6666-6666-666666666602';
  v_ing_vaso_l uuid := '66666666-6666-6666-6666-666666666603';
  v_ing_vaso_xl uuid := '66666666-6666-6666-6666-666666666604';
  v_ing_chicle uuid := '66666666-6666-6666-6666-666666666605';
  v_ing_mora uuid := '66666666-6666-6666-6666-666666666606';
  v_ing_fresa uuid := '66666666-6666-6666-6666-666666666607';
  v_variant_id uuid;
  v_price_id uuid;
  v_recipe_id uuid;
  v_vaso_id uuid;
  v_jarabe_id uuid;
  v_ml numeric;
  r_size record;
  r_flavor record;
begin
  insert into public.businesses (
    id, name, currency, timezone, locale, inventory_policy, address, phone
  ) values (
    v_business_id,
    'Granizados Demo',
    'COP',
    'America/Bogota',
    'es-CO',
    'block',
    'Calle Demo 123',
    '3000000000'
  )
  on conflict (id) do nothing;

  insert into public.inventory_reasons (business_id, code, name, qty_sign) values
    (v_business_id, 'purchase', 'Compra', 1),
    (v_business_id, 'sale', 'Venta', -1),
    (v_business_id, 'adjustment', 'Ajuste', 0),
    (v_business_id, 'waste', 'Merma', -1),
    (v_business_id, 'theft', 'Robo', -1),
    (v_business_id, 'reversal', 'Devolución/anulación', 1),
    (v_business_id, 'production', 'Producción', 0)
  on conflict (business_id, code) do nothing;

  insert into public.payment_methods (business_id, name, code, sort_order) values
    (v_business_id, 'Efectivo', 'cash', 1),
    (v_business_id, 'Tarjeta', 'card', 2),
    (v_business_id, 'Transferencia', 'transfer', 3)
  on conflict (business_id, code) do nothing;

  insert into public.categories (id, business_id, name, sort_order) values
    (v_category_id, v_business_id, 'Granizados', 1)
  on conflict (id) do nothing;

  insert into public.products (id, business_id, category_id, name) values
    (v_product_id, v_business_id, v_category_id, 'Granizado')
  on conflict (id) do nothing;

  insert into public.option_groups (id, business_id, product_id, name, sort_order) values
    (v_group_size, v_business_id, v_product_id, 'Tamaño', 1),
    (v_group_flavor, v_business_id, v_product_id, 'Sabor', 2)
  on conflict (id) do nothing;

  insert into public.option_values (id, business_id, option_group_id, name, sort_order) values
    (v_size_s, v_business_id, v_group_size, 'S', 1),
    (v_size_m, v_business_id, v_group_size, 'M', 2),
    (v_size_l, v_business_id, v_group_size, 'L', 3),
    (v_size_xl, v_business_id, v_group_size, 'XL', 4),
    (v_flavor_chicle, v_business_id, v_group_flavor, 'Chicle', 1),
    (v_flavor_mora, v_business_id, v_group_flavor, 'Mora', 2),
    (v_flavor_fresa, v_business_id, v_group_flavor, 'Fresa', 3)
  on conflict (id) do nothing;

  insert into public.ingredients (
    id, business_id, name, unit, stock_qty, min_stock, stock_tolerance, cost_per_unit
  ) values
    (v_ing_vaso_s, v_business_id, 'Vaso S', 'unit', 200, 20, 0, 100),
    (v_ing_vaso_m, v_business_id, 'Vaso M', 'unit', 200, 20, 0, 150),
    (v_ing_vaso_l, v_business_id, 'Vaso L', 'unit', 200, 20, 0, 200),
    (v_ing_vaso_xl, v_business_id, 'Vaso XL', 'unit', 200, 20, 0, 250),
    (v_ing_chicle, v_business_id, 'Jarabe Chicle', 'ml', 10000, 1000, 50, 0.03),
    (v_ing_mora, v_business_id, 'Jarabe Mora', 'ml', 10000, 1000, 50, 0.03),
    (v_ing_fresa, v_business_id, 'Jarabe Fresa', 'ml', 10000, 1000, 50, 0.03)
  on conflict (id) do nothing;

  for r_size in
    select * from (values
      (v_size_s, 'S', v_ing_vaso_s, 150::numeric, 5000::numeric),
      (v_size_m, 'M', v_ing_vaso_m, 200::numeric, 7000::numeric),
      (v_size_l, 'L', v_ing_vaso_l, 250::numeric, 9000::numeric),
      (v_size_xl, 'XL', v_ing_vaso_xl, 300::numeric, 11000::numeric)
    ) as t(size_id, size_name, vaso_id, ml, price)
  loop
    for r_flavor in
      select * from (values
        (v_flavor_chicle, 'Chicle', v_ing_chicle),
        (v_flavor_mora, 'Mora', v_ing_mora),
        (v_flavor_fresa, 'Fresa', v_ing_fresa)
      ) as f(flavor_id, flavor_name, jarabe_id)
    loop
      v_variant_id := gen_random_uuid();
      v_price_id := gen_random_uuid();
      v_recipe_id := gen_random_uuid();

      insert into public.product_variants (
        id, business_id, product_id, sku, sku_label, options_hash, is_active
      ) values (
        v_variant_id,
        v_business_id,
        v_product_id,
        'GRA-' || r_size.size_name || '-' || upper(left(r_flavor.flavor_name, 3)),
        'Granizado ' || r_size.size_name || ' ' || r_flavor.flavor_name,
        v_product_id::text || ':' || r_size.size_id::text || ':' || r_flavor.flavor_id::text,
        true
      );

      insert into public.variant_option_values (variant_id, option_value_id) values
        (v_variant_id, r_size.size_id),
        (v_variant_id, r_flavor.flavor_id);

      insert into public.variant_prices (id, variant_id, price) values
        (v_price_id, v_variant_id, r_size.price);

      insert into public.recipe_versions (id, variant_id, version_number, notes) values
        (v_recipe_id, v_variant_id, 1, 'Receta inicial');

      insert into public.recipe_items (recipe_version_id, ingredient_id, qty) values
        (v_recipe_id, r_size.vaso_id, 1),
        (v_recipe_id, r_flavor.jarabe_id, r_size.ml);

      update public.product_variants
      set current_price_id = v_price_id,
          current_recipe_version_id = v_recipe_id
      where id = v_variant_id;
    end loop;
  end loop;

  insert into public.sale_sequences (business_id, last_value)
  values (v_business_id, 0)
  on conflict (business_id) do nothing;
end $$;
