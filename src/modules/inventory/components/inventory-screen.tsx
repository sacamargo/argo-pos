import { useMemo, useState } from "react";
import { Button, Modal } from "@/components";
import {
  CreateIngredientForm,
  EditIngredientForm,
  MovementForms,
} from "@/modules/inventory/components/inventory-forms";
import {
  IngredientsTable,
  MovementsTable,
} from "@/modules/inventory/components/inventory-tables";
import { useInventoryScreen } from "@/modules/inventory/hooks/use-inventory-screen";
import { ListSearchInput } from "@/modules/shared/components/list-search-input";
import { matchesNameSearch } from "@/shared/utils/name-search";

export function InventoryScreen() {
  const s = useInventoryScreen();
  const [query, setQuery] = useState("");

  const filteredIngredients = useMemo(
    () => s.ingredients.filter((item) => matchesNameSearch(item.name, query)),
    [s.ingredients, query],
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Bodega: insumos y stock. Lo vendible empaquetado se crea en Catálogo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="h-11" onClick={s.openCreate}>
            Agregar ítem
          </Button>
          <Button
            className="h-11"
            variant="outline"
            onClick={() => {
              s.setMoveOpen(true);
            }}
          >
            Mover stock
          </Button>
        </div>
      </div>

      {s.error && !s.createOpen && !s.editOpen && !s.moveOpen ? (
        <p className="text-sm text-destructive">{s.error}</p>
      ) : null}

      <ListSearchInput
        value={query}
        onChange={setQuery}
        placeholder="Buscar ítem por nombre…"
      />

      <IngredientsTable
        loading={s.loading}
        ingredients={filteredIngredients}
        totalCount={s.ingredients.length}
        searchQuery={query}
        lowCount={s.lowCount}
        busyId={s.busyId}
        onEdit={s.startEdit}
        onToggleActive={(item) => void s.toggleActive(item)}
      />
      <MovementsTable movements={s.movements} />

      <Modal
        open={s.createOpen}
        title="Agregar al inventario"
        description="Insumos y mercadería de bodega (vaso, pajita, base…)."
        onClose={s.cancelEdit}
      >
        {s.error ? <p className="mb-3 text-sm text-destructive">{s.error}</p> : null}
        <CreateIngredientForm
          busy={s.busy}
          name={s.newName}
          unit={s.newUnit}
          minStock={s.newMin}
          initialStock={s.newInitial}
          onNameChange={s.setNewName}
          onUnitChange={s.setNewUnit}
          onMinChange={s.setNewMin}
          onInitialChange={s.setNewInitial}
          onSubmit={() => void s.createIngredient()}
          onCancel={s.cancelEdit}
        />
      </Modal>

      <Modal
        open={s.editOpen && Boolean(s.editingItem)}
        title="Editar ítem"
        description="Nombre, unidad y alerta. El stock solo cambia con movimientos."
        onClose={s.cancelEdit}
      >
        {s.error ? <p className="mb-3 text-sm text-destructive">{s.error}</p> : null}
        {s.editingItem ? (
          <EditIngredientForm
            busy={s.busy}
            item={s.editingItem}
            name={s.newName}
            unit={s.newUnit}
            minStock={s.newMin}
            onNameChange={s.setNewName}
            onUnitChange={s.setNewUnit}
            onMinChange={s.setNewMin}
            onSubmit={() => void s.saveEdit()}
            onCancel={s.cancelEdit}
          />
        ) : null}
      </Modal>

      <Modal
        open={s.moveOpen}
        title="Mover stock"
        description="Compra/llegada o corrección con nota."
        onClose={() => s.setMoveOpen(false)}
        className="max-w-xl"
      >
        {s.error ? <p className="mb-3 text-sm text-destructive">{s.error}</p> : null}
        <MovementForms
          busy={s.busy}
          ingredients={s.ingredients}
          selectedId={s.selectedId}
          entryQty={s.entryQty}
          entryNote={s.entryNote}
          adjustQty={s.adjustQty}
          adjustNote={s.adjustNote}
          onSelect={s.setSelectedId}
          onEntryQty={s.setEntryQty}
          onEntryNote={s.setEntryNote}
          onAdjustQty={s.setAdjustQty}
          onAdjustNote={s.setAdjustNote}
          onEntry={() => void s.registerEntry()}
          onAdjust={() => void s.registerAdjustment()}
        />
      </Modal>
    </div>
  );
}
