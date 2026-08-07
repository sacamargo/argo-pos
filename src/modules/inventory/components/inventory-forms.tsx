import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components";
import type { Ingredient } from "@/domain/entities/ingredient";

type CreateIngredientFormProps = {
  busy: boolean;
  code: string;
  name: string;
  unit: string;
  minStock: string;
  initialStock: string;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onMinChange: (value: string) => void;
  onInitialChange: (value: string) => void;
  onSubmit: () => void;
};

export function CreateIngredientForm({
  busy,
  code,
  name,
  unit,
  minStock,
  initialStock,
  onCodeChange,
  onNameChange,
  onUnitChange,
  onMinChange,
  onInitialChange,
  onSubmit,
}: CreateIngredientFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Nuevo ítem de inventario</CardTitle>
        <CardDescription>
          Si pones stock inicial, se crea un movimiento de entrada.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          className="h-11"
          placeholder="Código (INV-VASO-12)"
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
        />
        <Input
          className="h-11"
          placeholder="Nombre"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
        <Input
          className="h-11"
          placeholder="Unidad (ml, g, und)"
          value={unit}
          onChange={(e) => onUnitChange(e.target.value)}
        />
        <Input
          className="h-11"
          type="number"
          placeholder="Stock mínimo"
          value={minStock}
          onChange={(e) => onMinChange(e.target.value)}
        />
        <Input
          className="h-11"
          type="number"
          placeholder="Stock inicial"
          value={initialStock}
          onChange={(e) => onInitialChange(e.target.value)}
        />
        <Button className="h-11" disabled={busy} onClick={onSubmit}>
          Crear
        </Button>
      </CardContent>
    </Card>
  );
}

type MovementFormsProps = {
  busy: boolean;
  ingredients: Ingredient[];
  selectedId: string;
  entryQty: string;
  entryNote: string;
  adjustQty: string;
  adjustNote: string;
  onSelect: (id: string) => void;
  onEntryQty: (value: string) => void;
  onEntryNote: (value: string) => void;
  onAdjustQty: (value: string) => void;
  onAdjustNote: (value: string) => void;
  onEntry: () => void;
  onAdjust: () => void;
};

export function MovementForms({
  busy,
  ingredients,
  selectedId,
  entryQty,
  entryNote,
  adjustQty,
  adjustNote,
  onSelect,
  onEntryQty,
  onEntryNote,
  onAdjustQty,
  onAdjustNote,
  onEntry,
  onAdjust,
}: MovementFormsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Movimientos</CardTitle>
        <CardDescription>Entrada de compra o ajuste con nota.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <select
          className="h-11 rounded-md border border-input bg-card px-3 text-sm"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
        >
          {ingredients.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} · {item.name} ({item.unit}) — {item.stockQuantity}
            </option>
          ))}
        </select>

        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-sm font-medium">Entrada</p>
          <Input
            className="h-11"
            type="number"
            placeholder="Cantidad +"
            value={entryQty}
            onChange={(e) => onEntryQty(e.target.value)}
          />
          <Input
            className="h-11"
            placeholder="Nota (opcional)"
            value={entryNote}
            onChange={(e) => onEntryNote(e.target.value)}
          />
          <Button variant="outline" disabled={busy} onClick={onEntry}>
            Registrar entrada
          </Button>
        </div>

        <div className="space-y-2 rounded-md border border-border p-3">
          <p className="text-sm font-medium">Ajuste (+/−)</p>
          <Input
            className="h-11"
            type="number"
            placeholder="Ej. -100 o 50"
            value={adjustQty}
            onChange={(e) => onAdjustQty(e.target.value)}
          />
          <Input
            className="h-11"
            placeholder="Nota obligatoria"
            value={adjustNote}
            onChange={(e) => onAdjustNote(e.target.value)}
          />
          <Button variant="outline" disabled={busy} onClick={onAdjust}>
            Registrar ajuste
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
