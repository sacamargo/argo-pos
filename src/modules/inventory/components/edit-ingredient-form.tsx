import type { ReactNode } from "react";
import { Button, Input } from "@/components";
import type { Ingredient } from "@/domain/entities/ingredient";
import {
  FieldLabel,
  UnitField,
} from "@/modules/inventory/components/inventory-form-fields";

type EditIngredientFormProps = {
  busy: boolean;
  item: Ingredient;
  name: string;
  unit: string;
  minStock: string;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onMinChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  /** Stock entry / adjustment UI. */
  stockSection?: ReactNode;
};

export function EditIngredientForm({
  busy,
  item,
  name,
  unit,
  minStock,
  onNameChange,
  onUnitChange,
  onMinChange,
  onSubmit,
  onCancel,
  stockSection,
}: EditIngredientFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        {item.name} — stock actual: {item.stockQuantity} {item.unit}
      </p>
      <div className="space-y-2">
        <FieldLabel htmlFor="inv-edit-name">Nombre</FieldLabel>
        <Input
          id="inv-edit-name"
          className="h-11"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <UnitField unit={unit} onUnitChange={onUnitChange} />
      <div className="space-y-2">
        <FieldLabel htmlFor="inv-edit-min">Avisar cuando queden pocas</FieldLabel>
        <Input
          id="inv-edit-min"
          className="h-11"
          type="number"
          min={0}
          value={minStock}
          onChange={(e) => onMinChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="h-11" disabled={busy} onClick={onSubmit}>
          Guardar cambios
        </Button>
        <Button className="h-11" variant="outline" disabled={busy} onClick={onCancel}>
          Cancelar
        </Button>
      </div>

      {stockSection ? (
        <div className="flex flex-col gap-3 border-t border-border pt-4">
          <div>
            <p className="text-sm font-medium">Cambiar stock</p>
            <p className="text-xs text-muted-foreground">
              Suma una llegada o corrige la cantidad (queda registrado en el historial).
            </p>
          </div>
          {stockSection}
        </div>
      ) : null}
    </div>
  );
}
