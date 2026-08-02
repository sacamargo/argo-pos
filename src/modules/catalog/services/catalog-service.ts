"use server";

import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/modules/core/errors/app-error";
import {
  createProductWizardSchema,
  type CreateProductWizardInput,
} from "@/modules/catalog/validators/create-product";
import { z } from "zod";

function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>(
    (acc, curr) =>
      acc.flatMap((prefix) => curr.map((item) => [...prefix, item])),
    [[]],
  );
}

export async function listVariants() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_variants")
      .select("id, sku, sku_label, is_active, current_price_id, products(name)")
      .order("sku_label");

    if (error) throw error;

    const priceIds = (data ?? [])
      .map((row) => row.current_price_id)
      .filter((id): id is string => Boolean(id));

    const { data: prices } = await supabase
      .from("variant_prices")
      .select("id, price")
      .in(
        "id",
        priceIds.length ? priceIds : ["00000000-0000-0000-0000-000000000000"],
      );

    const priceMap = new Map(
      (prices ?? []).map((row) => [row.id, Number(row.price)]),
    );

    return (data ?? []).map((row) => {
      const product = row.products as
        | { name: string }
        | { name: string }[]
        | null;
      const productName = Array.isArray(product)
        ? product[0]?.name
        : product?.name;

      return {
        id: row.id,
        sku: row.sku,
        label: row.sku_label,
        productName: productName ?? "—",
        price: priceMap.get(row.current_price_id ?? "") ?? 0,
        isActive: row.is_active,
      };
    });
  } catch (error) {
    throw toAppError(error, "VARIANTS_LIST_FAILED");
  }
}

export async function listCategories() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order");
    if (error) throw error;
    return data ?? [];
  } catch (error) {
    throw toAppError(error, "CATEGORIES_LIST_FAILED");
  }
}

export async function createProductWithVariants(input: CreateProductWizardInput) {
  try {
    const parsed = createProductWizardSchema.parse(input);
    if (!parsed.categoryId && !parsed.newCategoryName) {
      throw new Error("Selecciona o crea una categoría");
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("UNAUTHORIZED");

    const { data: profile } = await supabase
      .from("profiles")
      .select("business_id")
      .eq("id", user.id)
      .single();
    if (!profile) throw new Error("MISSING_PROFILE");

    const businessId = profile.business_id;
    let categoryId = parsed.categoryId;

    if (!categoryId && parsed.newCategoryName) {
      const { data: category, error: catError } = await supabase
        .from("categories")
        .insert({
          business_id: businessId,
          name: parsed.newCategoryName,
          sort_order: 99,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("id")
        .single();
      if (catError) throw catError;
      categoryId = category.id;
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        business_id: businessId,
        category_id: categoryId!,
        name: parsed.productName,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();
    if (productError) throw productError;

    const groupValueIds: string[][] = [];
    const valueNames = new Map<string, string>();

    for (const [groupIndex, group] of parsed.optionGroups.entries()) {
      const { data: optionGroup, error: groupError } = await supabase
        .from("option_groups")
        .insert({
          business_id: businessId,
          product_id: product.id,
          name: group.name,
          sort_order: groupIndex + 1,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("id")
        .single();
      if (groupError) throw groupError;

      const ids: string[] = [];
      for (const [valueIndex, valueName] of group.values.entries()) {
        const { data: optionValue, error: valueError } = await supabase
          .from("option_values")
          .insert({
            business_id: businessId,
            option_group_id: optionGroup.id,
            name: valueName,
            sort_order: valueIndex + 1,
            created_by: user.id,
            updated_by: user.id,
          })
          .select("id")
          .single();
        if (valueError) throw valueError;
        ids.push(optionValue.id);
        valueNames.set(optionValue.id, valueName);
      }
      groupValueIds.push(ids);
    }

    const combinations = cartesian(groupValueIds);
    let created = 0;

    for (const combo of combinations) {
      const labelParts = combo.map((id) => valueNames.get(id) ?? "");
      const skuLabel = `${parsed.productName} ${labelParts.join(" ")}`.trim();
      const optionsHash = `${product.id}:${combo.slice().sort().join(":")}`;

      const { data: variant, error: variantError } = await supabase
        .from("product_variants")
        .insert({
          business_id: businessId,
          product_id: product.id,
          sku_label: skuLabel,
          options_hash: optionsHash,
          created_by: user.id,
          updated_by: user.id,
        })
        .select("id")
        .single();
      if (variantError) throw variantError;

      const { error: linkError } = await supabase
        .from("variant_option_values")
        .insert(
          combo.map((optionValueId) => ({
            variant_id: variant.id,
            option_value_id: optionValueId,
          })),
        );
      if (linkError) throw linkError;

      const { data: price, error: priceError } = await supabase
        .from("variant_prices")
        .insert({
          variant_id: variant.id,
          price: parsed.basePrice,
          created_by: user.id,
        })
        .select("id")
        .single();
      if (priceError) throw priceError;

      const { data: recipe, error: recipeError } = await supabase
        .from("recipe_versions")
        .insert({
          variant_id: variant.id,
          version_number: 1,
          notes: "Receta inicial",
          created_by: user.id,
        })
        .select("id")
        .single();
      if (recipeError) throw recipeError;

      const { error: recipeItemsError } = await supabase
        .from("recipe_items")
        .insert(
          parsed.recipeItems.map((item) => ({
            recipe_version_id: recipe.id,
            ingredient_id: item.ingredientId,
            qty: item.qty,
          })),
        );
      if (recipeItemsError) throw recipeItemsError;

      const { error: updateError } = await supabase
        .from("product_variants")
        .update({
          current_price_id: price.id,
          current_recipe_version_id: recipe.id,
        })
        .eq("id", variant.id);
      if (updateError) throw updateError;

      created += 1;
    }

    return { ok: true as const, productId: product.id, variantsCreated: created };
  } catch (error) {
    throw toAppError(error, "PRODUCT_CREATE_FAILED");
  }
}

const updatePriceSchema = z.object({
  variantId: z.uuid(),
  price: z.number().positive(),
});

export async function updateVariantPrice(input: z.infer<typeof updatePriceSchema>) {
  try {
    const parsed = updatePriceSchema.parse(input);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("UNAUTHORIZED");

    const now = new Date().toISOString();

    const { data: variant } = await supabase
      .from("product_variants")
      .select("id, current_price_id")
      .eq("id", parsed.variantId)
      .single();
    if (!variant) throw new Error("VARIANT_NOT_FOUND");

    if (variant.current_price_id) {
      await supabase
        .from("variant_prices")
        .update({ valid_to: now })
        .eq("id", variant.current_price_id);
    }

    const { data: price, error } = await supabase
      .from("variant_prices")
      .insert({
        variant_id: parsed.variantId,
        price: parsed.price,
        valid_from: now,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (error) throw error;

    const { error: updateError } = await supabase
      .from("product_variants")
      .update({ current_price_id: price.id })
      .eq("id", parsed.variantId);
    if (updateError) throw updateError;

    return { ok: true as const };
  } catch (error) {
    throw toAppError(error, "PRICE_UPDATE_FAILED");
  }
}
