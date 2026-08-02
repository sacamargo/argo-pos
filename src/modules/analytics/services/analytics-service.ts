"use server";

import { createClient } from "@/lib/supabase/server";
import { toAppError } from "@/modules/core/errors/app-error";
import { getCurrentProfile } from "@/modules/auth/services/auth-service";
import { isStaffManager } from "@/modules/core/permissions";
import type { Role } from "@/modules/core/constants";

export type DashboardSummary = {
  salesToday: number;
  salesMonth: number;
  criticalIngredients: Array<{
    id: string;
    name: string;
    stockQty: number;
    minStock: number;
  }>;
  recentSales: Array<{
    id: string;
    publicId: string;
    total: number;
    createdAt: string;
    paymentMethodName: string;
    status: string;
  }>;
  topProductToday: string | null;
  showInventory: boolean;
};

function startOfDayIso() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function startOfMonthIso() {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  try {
    const profile = await getCurrentProfile();
    const showInventory = profile
      ? isStaffManager(profile.role as Role)
      : false;

    const supabase = await createClient();
    const dayStart = startOfDayIso();
    const monthStart = startOfMonthIso();

    const [todaySales, monthSales, critical, recent, todayItems] =
      await Promise.all([
        supabase
          .from("sales")
          .select("total")
          .eq("status", "completed")
          .gte("created_at", dayStart),
        supabase
          .from("sales")
          .select("total")
          .eq("status", "completed")
          .gte("created_at", monthStart),
        showInventory
          ? supabase
              .from("ingredients")
              .select("id, name, stock_qty, min_stock")
              .eq("is_active", true)
          : Promise.resolve({ data: [], error: null }),
        supabase
          .from("sales")
          .select(
            "id, public_id, total, created_at, status, payment_methods(name)",
          )
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("sale_items")
          .select("product_name, quantity, sales!inner(created_at, status)")
          .gte("sales.created_at", dayStart)
          .eq("sales.status", "completed"),
      ]);

    const error =
      todaySales.error ||
      monthSales.error ||
      critical.error ||
      recent.error ||
      todayItems.error;
    if (error) throw error;

    const salesToday = (todaySales.data ?? []).reduce(
      (sum, row) => sum + Number(row.total),
      0,
    );
    const salesMonth = (monthSales.data ?? []).reduce(
      (sum, row) => sum + Number(row.total),
      0,
    );

    const productCounts = new Map<string, number>();
    for (const item of todayItems.data ?? []) {
      productCounts.set(
        item.product_name,
        (productCounts.get(item.product_name) ?? 0) + item.quantity,
      );
    }

    let topProductToday: string | null = null;
    let topQty = 0;
    for (const [name, qty] of productCounts) {
      if (qty > topQty) {
        topQty = qty;
        topProductToday = name;
      }
    }

    return {
      salesToday,
      salesMonth,
      showInventory,
      criticalIngredients: (critical.data ?? [])
        .filter((row) => Number(row.stock_qty) <= Number(row.min_stock))
        .map((row) => ({
          id: row.id,
          name: row.name,
          stockQty: Number(row.stock_qty),
          minStock: Number(row.min_stock),
        })),
      recentSales: (recent.data ?? []).map((row) => {
        const payment = row.payment_methods as
          | { name: string }
          | { name: string }[]
          | null;
        return {
          id: row.id,
          publicId: row.public_id,
          total: Number(row.total),
          createdAt: row.created_at,
          status: row.status,
          paymentMethodName: Array.isArray(payment)
            ? (payment[0]?.name ?? "—")
            : (payment?.name ?? "—"),
        };
      }),
      topProductToday,
    };
  } catch (error) {
    throw toAppError(error, "ANALYTICS_DASHBOARD_FAILED");
  }
}
