import { z } from "zod";

/** Stable internal business code for Excel upsert (CAT-*, INV-*, PROD-*). Not shown in UI. */
export const businessCodeSchema = z
  .string()
  .trim()
  .min(1, "El código es obligatorio")
  .max(40, "Máximo 40 caracteres")
  .regex(
    /^[A-Za-z0-9]+(?:[._-][A-Za-z0-9]+)*$/,
    "Usa letras, números, . _ - (ej. CAT-9F4A8C)",
  );

export type BusinessCodePrefix = "CAT" | "INV" | "PROD";

export function normalizeBusinessCode(code: string): string {
  return code.trim().toUpperCase();
}

/** Random internal code: PREFIX-XXXXXX (6 hex). No table scans. */
export function generateBusinessCode(prefix: BusinessCodePrefix): string {
  const bytes = new Uint8Array(3);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  return `${prefix}-${suffix}`;
}

const MAX_CODE_ATTEMPTS = 8;

/**
 * Resolves create-time code: use provided (Excel) or generate until unique.
 * `isTaken` should return true if the normalized code already exists.
 */
export async function resolveCreateBusinessCode(
  prefix: BusinessCodePrefix,
  provided: string | undefined,
  isTaken: (code: string) => Promise<boolean>,
): Promise<string> {
  if (provided !== undefined) {
    const code = normalizeBusinessCode(provided);
    if (await isTaken(code)) {
      throw new Error(`Ya existe un registro con código ${code}`);
    }
    return code;
  }

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = generateBusinessCode(prefix);
    if (!(await isTaken(code))) {
      return code;
    }
  }

  throw new Error("No se pudo generar un código único");
}
