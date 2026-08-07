import { Input } from "@/components";
import {
  DEFAULT_INVENTORY_UNIT,
  INVENTORY_UNIT_OTHER,
  INVENTORY_UNIT_PRESETS,
  isPresetUnit,
} from "@/modules/inventory/constants/units";

export function FieldLabel({
  htmlFor,
  children,
  hint,
}: {
  htmlFor: string;
  children: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {children}
      </label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

type UnitFieldProps = {
  unit: string;
  onUnitChange: (value: string) => void;
};

export function UnitField({ unit, onUnitChange }: UnitFieldProps) {
  const usingOther = unit !== "" && !isPresetUnit(unit);
  const selectValue = usingOther ? INVENTORY_UNIT_OTHER : unit || DEFAULT_INVENTORY_UNIT;

  return (
    <div className="space-y-2">
      <FieldLabel
        htmlFor="inv-unit"
        hint="Doritos o vaso → und. Jarabe o base → ml. Si no encaja, elige Otra."
      >
        Cómo se cuenta (unidad)
      </FieldLabel>
      <select
        id="inv-unit"
        className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
        value={selectValue}
        onChange={(e) => {
          const next = e.target.value;
          if (next === INVENTORY_UNIT_OTHER) {
            onUnitChange(usingOther ? unit : "");
            return;
          }
          onUnitChange(next);
        }}
      >
        {INVENTORY_UNIT_PRESETS.map((preset) => (
          <option key={preset.value} value={preset.value}>
            {preset.value} — {preset.hint}
          </option>
        ))}
        <option value={INVENTORY_UNIT_OTHER}>Otra…</option>
      </select>
      {selectValue === INVENTORY_UNIT_OTHER ? (
        <Input
          className="h-11"
          placeholder="Escribe la unidad (ej. litro, paquete)"
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
        />
      ) : null}
    </div>
  );
}
