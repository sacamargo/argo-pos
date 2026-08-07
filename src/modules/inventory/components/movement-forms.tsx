import { Button, Input } from "@/components";
import type { Ingredient } from "@/domain/entities/ingredient";
import { FieldLabel } from "@/modules/inventory/components/inventory-form-fields";

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
  const activeItems = ingredients.filter((item) => item.active);

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-2">
        <FieldLabel htmlFor="inv-item">Qué ítem quieres cambiar</FieldLabel>
        <select
          id="inv-item"
          className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
          value={selectedId}
          onChange={(e) => onSelect(e.target.value)}
        >
          {activeItems.length === 0 ? <option value="">Sin ítems activos</option> : null}
          {activeItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — tienes {item.stockQuantity} {item.unit}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 rounded-md border border-border p-3">
        <p className="text-sm font-medium">Sumar compra / llegada</p>
        <Input
          className="h-11"
          type="number"
          min={0}
          placeholder="Cuánto llegó (+)"
          value={entryQty}
          onChange={(e) => onEntryQty(e.target.value)}
        />
        <Input
          className="h-11"
          placeholder="Nota opcional (ej. factura 123)"
          value={entryNote}
          onChange={(e) => onEntryNote(e.target.value)}
        />
        <Button variant="outline" disabled={busy || !selectedId} onClick={onEntry}>
          Sumar al stock
        </Button>
      </div>

      <div className="space-y-2 rounded-md border border-border p-3">
        <p className="text-sm font-medium">Corregir cantidad</p>
        <p className="text-xs text-muted-foreground">
          Negativo resta (ej. -5). La nota es obligatoria.
        </p>
        <Input
          className="h-11"
          type="number"
          placeholder="Ej. -5 o 10"
          value={adjustQty}
          onChange={(e) => onAdjustQty(e.target.value)}
        />
        <Input
          className="h-11"
          placeholder="Por qué corriges (obligatorio)"
          value={adjustNote}
          onChange={(e) => onAdjustNote(e.target.value)}
        />
        <Button variant="outline" disabled={busy || !selectedId} onClick={onAdjust}>
          Registrar corrección
        </Button>
      </div>
    </div>
  );
}
