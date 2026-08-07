import { Button, Input } from "@/components";
import type { Ingredient } from "@/domain/entities/ingredient";

type MovementFormsProps = {
  busy: boolean;
  item: Ingredient;
  entryQty: string;
  entryNote: string;
  adjustQty: string;
  adjustNote: string;
  onEntryQty: (value: string) => void;
  onEntryNote: (value: string) => void;
  onAdjustQty: (value: string) => void;
  onAdjustNote: (value: string) => void;
  onEntry: () => void;
  onAdjust: () => void;
};

export function MovementForms({
  busy,
  item,
  entryQty,
  entryNote,
  adjustQty,
  adjustNote,
  onEntryQty,
  onEntryNote,
  onAdjustQty,
  onAdjustNote,
  onEntry,
  onAdjust,
}: MovementFormsProps) {
  const canMove = item.active;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Stock actual:{" "}
        <span className="font-medium text-foreground">
          {item.stockQuantity} {item.unit}
        </span>
        {!canMove ? (
          <span className="block text-destructive">
            Ítem oculto: actívalo (Mostrar) para cambiar el stock.
          </span>
        ) : null}
      </p>

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
        <Button variant="outline" disabled={busy || !canMove} onClick={onEntry}>
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
        <Button variant="outline" disabled={busy || !canMove} onClick={onAdjust}>
          Registrar corrección
        </Button>
      </div>
    </div>
  );
}
