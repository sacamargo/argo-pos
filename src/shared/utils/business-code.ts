import { z } from "zod";

/** Stable business code for Excel upsert and lookups (CAT-*, INV-*, PROD-*). */
export const businessCodeSchema = z
  .string()
  .trim()
  .min(1, "El código es obligatorio")
  .max(40, "Máximo 40 caracteres")
  .regex(
    /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/,
    "Usa letras, números, . _ - (ej. CAT-GRAN, INV-VASO-12)",
  );

export function normalizeBusinessCode(code: string): string {
  return code.trim().toUpperCase();
}
