import { Button, Input } from "@/components";
import {
  FieldLabel,
  UnitField,
} from "@/modules/inventory/components/inventory-form-fields";

type CreateIngredientFormProps = {
  busy: boolean;
  name: string;
  unit: string;
  minStock: string;
  initialStock: string;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onMinChange: (value: string) => void;
  onInitialChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function CreateIngredientForm({
  busy,
  name,
  unit,
  minStock,
  initialStock,
  onNameChange,
  onUnitChange,
  onMinChange,
  onInitialChange,
  onSubmit,
  onCancel,
}: CreateIngredientFormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <FieldLabel htmlFor="inv-name" hint="Nombre que verás al editar y en el historial.">
          Nombre
        </FieldLabel>
        <Input
          id="inv-name"
          className="h-11"
          placeholder="Ej. Vaso 16 oz, Base mora, Pajita"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <UnitField unit={unit} onUnitChange={onUnitChange} />
      <div className="space-y-2">
        <FieldLabel
          htmlFor="inv-min"
          hint="Te avisamos cuando el stock baje a este número o menos."
        >
          Avisar cuando queden pocas
        </FieldLabel>
        <Input
          id="inv-min"
          className="h-11"
          type="number"
          min={0}
          value={minStock}
          onChange={(e) => onMinChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <FieldLabel
          htmlFor="inv-initial"
          hint="Cuánto tienes ahora. Déjalo en 0 si aún no llegó mercancía."
        >
          Cantidad inicial
        </FieldLabel>
        <Input
          id="inv-initial"
          className="h-11"
          type="number"
          min={0}
          value={initialStock}
          onChange={(e) => onInitialChange(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button className="h-11" disabled={busy} onClick={onSubmit}>
          Guardar en inventario
        </Button>
        <Button className="h-11" variant="outline" disabled={busy} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
