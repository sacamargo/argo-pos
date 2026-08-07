/** Unidades sugeridas para inventario (valor persistido = string libre). */
export const INVENTORY_UNIT_PRESETS = [
  { value: "und", hint: "piezas (Doritos, vaso, pajita, sticker)" },
  { value: "ml", hint: "líquidos (jarabe, base de sabor)" },
  { value: "g", hint: "peso (azúcar, polvo)" },
  { value: "oz", hint: "onzas de líquido" },
  { value: "caja", hint: "cajas cerradas" },
] as const;

export const INVENTORY_UNIT_OTHER = "__other__";

export const DEFAULT_INVENTORY_UNIT = "und";

export function isPresetUnit(unit: string): boolean {
  return INVENTORY_UNIT_PRESETS.some((preset) => preset.value === unit);
}
