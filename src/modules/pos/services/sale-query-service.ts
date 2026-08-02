"use server";

import { createClient } from "@/lib/supabase/server";
import { AppError, toAppError } from "@/modules/core/errors/app-error";
import { getCurrentProfile } from "@/modules/auth/services/auth-service";
import { canReverseSale } from "@/modules/core/permissions";
import type { Role } from "@/modules/core/constants";

export type SaleListItem = {
  id: string;
  publicId: string;
  total: number;
  status: string;
  createdAt: string;
  paymentMethodName: string;
  cashierName: string;
};

export type SaleDetail = SaleListItem & {
  notes: string | null;
  amountTendered: number | null;
  changeAmount: number | null;
  items: Array<{
    id: string;
    productName: string;
    optionsSnapshot: Array<{ group: string; value: string }>;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

export async function listSales(options?: {
  fromIso?: string;
  paymentMethodId?: string;
  limit?: number;
}): Promise<SaleListItem[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("sales")
      .select(
        "id, public_id, total, status, created_at, amount_tendered, change_amount, payment_methods(name), profiles!sales_user_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(options?.limit ?? 50);

    if (options?.fromIso) {
      query = query.gte("created_at", options.fromIso);
    }
    if (options?.paymentMethodId) {
      query = query.eq("payment_method_id", options.paymentMethodId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row) => {
      const payment = row.payment_methods as
        | { name: string }
        | { name: string }[]
        | null;
      const profile = row.profiles as
        | { full_name: string }
        | { full_name: string }[]
        | null;

      return {
        id: row.id,
        publicId: row.public_id,
        total: Number(row.total),
        status: row.status,
        createdAt: row.created_at,
        paymentMethodName: Array.isArray(payment)
          ? (payment[0]?.name ?? "—")
          : (payment?.name ?? "—"),
        cashierName: Array.isArray(profile)
          ? (profile[0]?.full_name ?? "—")
          : (profile?.full_name ?? "—"),
      };
    });
  } catch (error) {
    throw toAppError(error, "SALES_LIST_FAILED");
  }
}

export async function getSaleById(saleId: string): Promise<SaleDetail | null> {
  try {
    const supabase = await createClient();
    const { data: sale, error } = await supabase
      .from("sales")
      .select(
        "id, public_id, total, status, created_at, notes, amount_tendered, change_amount, payment_methods(name), profiles!sales_user_id_fkey(full_name)",
      )
      .eq("id", saleId)
      .maybeSingle();

    if (error) throw error;
    if (!sale) return null;

    const { data: items, error: itemsError } = await supabase
      .from("sale_items")
      .select(
        "id, product_name, options_snapshot, unit_price, quantity, line_total",
      )
      .eq("sale_id", saleId);

    if (itemsError) throw itemsError;

    const payment = sale.payment_methods as
      | { name: string }
      | { name: string }[]
      | null;
    const profile = sale.profiles as
      | { full_name: string }
      | { full_name: string }[]
      | null;

    return {
      id: sale.id,
      publicId: sale.public_id,
      total: Number(sale.total),
      status: sale.status,
      createdAt: sale.created_at,
      notes: sale.notes,
      amountTendered:
        sale.amount_tendered === null ? null : Number(sale.amount_tendered),
      changeAmount:
        sale.change_amount === null ? null : Number(sale.change_amount),
      paymentMethodName: Array.isArray(payment)
        ? (payment[0]?.name ?? "—")
        : (payment?.name ?? "—"),
      cashierName: Array.isArray(profile)
        ? (profile[0]?.full_name ?? "—")
        : (profile?.full_name ?? "—"),
      items: (items ?? []).map((item) => ({
        id: item.id,
        productName: item.product_name,
        optionsSnapshot: (item.options_snapshot ?? []) as Array<{
          group: string;
          value: string;
        }>,
        unitPrice: Number(item.unit_price),
        quantity: item.quantity,
        lineTotal: Number(item.line_total),
      })),
    };
  } catch (error) {
    throw toAppError(error, "SALE_DETAIL_FAILED");
  }
}

export async function reverseSale(saleId: string, reason: string) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || !canReverseSale(profile.role as Role)) {
      throw new AppError("FORBIDDEN", "No tienes permiso para anular ventas");
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("reverse_sale", {
      p_sale_id: saleId,
      p_reason: reason,
      p_reversal_type: "cancel",
    });

    if (error) throw error;
    return data;
  } catch (error) {
    throw toAppError(error, "REVERSE_SALE_FAILED");
  }
}
