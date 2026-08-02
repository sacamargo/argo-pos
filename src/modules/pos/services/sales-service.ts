"use server";

import { createClient } from "@/lib/supabase/server";
import { AppError, toAppError } from "@/modules/core/errors/app-error";
import { logger } from "@/modules/core/logger/logger";
import { mapCreateSaleResult } from "@/modules/pos/mappers/sale-mapper";
import {
  createSaleSchema,
  type CreateSaleInput,
} from "@/modules/pos/validators/create-sale";

const SALE_LATENCY_BUDGET_MS = 500;

function humanizeSaleError(message: string): string {
  if (message.includes("INSUFFICIENT_STOCK:")) {
    const name = message.split("INSUFFICIENT_STOCK:")[1] ?? "ingrediente";
    return `Stock insuficiente: ${name.trim()}`;
  }
  if (message.includes("INSUFFICIENT_TENDER")) {
    return "El monto recibido es menor al total";
  }
  if (message.includes("AMOUNT_TENDERED_REQUIRED")) {
    return "Indica cuánto pagó el cliente en efectivo";
  }
  return message;
}

export async function createSale(input: CreateSaleInput) {
  const started = performance.now();

  try {
    const parsed = createSaleSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("create_sale", {
      p_payment_method_id: parsed.paymentMethodId,
      p_notes: parsed.notes ?? null,
      p_items: parsed.items.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
      })),
      p_amount_tendered: parsed.amountTendered ?? null,
      p_change_amount: parsed.changeAmount ?? null,
    });

    if (error) {
      throw new AppError("CREATE_SALE_FAILED", humanizeSaleError(error.message));
    }

    const durationMs = Math.round(performance.now() - started);
    const result = mapCreateSaleResult(data, durationMs);

    if (durationMs > SALE_LATENCY_BUDGET_MS) {
      logger.error("create_sale exceeded latency budget", {
        durationMs,
        budgetMs: SALE_LATENCY_BUDGET_MS,
        publicId: result.publicId,
      });
    } else {
      logger.info("create_sale ok", {
        durationMs,
        publicId: result.publicId,
      });
    }

    return result;
  } catch (error) {
    logger.error("createSale failed", { error: String(error) });
    throw toAppError(error, "CREATE_SALE_FAILED");
  }
}
