"use server";

import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/modules/core/errors/app-error";

export type PosCategory = {
  id: string;
  name: string;
  sortOrder: number;
};

export type PosProduct = {
  id: string;
  categoryId: string;
  name: string;
};

export type PosOptionGroup = {
  id: string;
  productId: string;
  name: string;
  sortOrder: number;
  isRequired: boolean;
  values: Array<{ id: string; name: string; sortOrder: number }>;
};

export type PosVariant = {
  id: string;
  productId: string;
  label: string;
  price: number;
  optionValueIds: string[];
};

export type PosPaymentMethod = {
  id: string;
  name: string;
  code: string;
};

export async function getPosCatalog() {
  try {
    const supabase = await createClient();

    const [categories, products, groups, values, variants, variantOptions, prices, payments] =
      await Promise.all([
        supabase
          .from("categories")
          .select("id, name, sort_order")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("products")
          .select("id, category_id, name")
          .eq("is_active", true),
        supabase
          .from("option_groups")
          .select("id, product_id, name, sort_order, is_required")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("option_values")
          .select("id, option_group_id, name, sort_order")
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("product_variants")
          .select("id, product_id, sku_label, current_price_id")
          .eq("is_active", true),
        supabase.from("variant_option_values").select("variant_id, option_value_id"),
        supabase.from("variant_prices").select("id, price"),
        supabase
          .from("payment_methods")
          .select("id, name, code, sort_order")
          .eq("is_active", true)
          .order("sort_order"),
      ]);

    const firstError =
      categories.error ||
      products.error ||
      groups.error ||
      values.error ||
      variants.error ||
      variantOptions.error ||
      prices.error ||
      payments.error;

    if (firstError) throw firstError;

    const priceById = new Map(
      (prices.data ?? []).map((row) => [row.id, Number(row.price)]),
    );

    const optionIdsByVariant = new Map<string, string[]>();
    for (const row of variantOptions.data ?? []) {
      const current = optionIdsByVariant.get(row.variant_id) ?? [];
      current.push(row.option_value_id);
      optionIdsByVariant.set(row.variant_id, current);
    }

    const valuesByGroup = new Map<string, PosOptionGroup["values"]>();
    for (const value of values.data ?? []) {
      const current = valuesByGroup.get(value.option_group_id) ?? [];
      current.push({
        id: value.id,
        name: value.name,
        sortOrder: value.sort_order,
      });
      valuesByGroup.set(value.option_group_id, current);
    }

    return {
      categories: (categories.data ?? []).map(
        (row): PosCategory => ({
          id: row.id,
          name: row.name,
          sortOrder: row.sort_order,
        }),
      ),
      products: (products.data ?? []).map(
        (row): PosProduct => ({
          id: row.id,
          categoryId: row.category_id,
          name: row.name,
        }),
      ),
      optionGroups: (groups.data ?? []).map(
        (row): PosOptionGroup => ({
          id: row.id,
          productId: row.product_id,
          name: row.name,
          sortOrder: row.sort_order,
          isRequired: row.is_required,
          values: valuesByGroup.get(row.id) ?? [],
        }),
      ),
      variants: (variants.data ?? []).map(
        (row): PosVariant => ({
          id: row.id,
          productId: row.product_id,
          label: row.sku_label,
          price: priceById.get(row.current_price_id ?? "") ?? 0,
          optionValueIds: optionIdsByVariant.get(row.id) ?? [],
        }),
      ),
      paymentMethods: (payments.data ?? []).map(
        (row): PosPaymentMethod => ({
          id: row.id,
          name: row.name,
          code: row.code,
        }),
      ),
    };
  } catch (error) {
    throw toAppError(error, "POS_CATALOG_LOAD_FAILED");
  }
}
