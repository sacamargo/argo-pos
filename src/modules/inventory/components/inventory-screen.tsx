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

export function InventoryScreen() {
  const s = useInventoryScreen();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          Bodega del negocio: insumos y stock. Los productos de venta se administran en
          Catálogo. El número de stock solo cambia con movimientos.
        </p>
      </div>

      {s.error ? <p className="text-sm text-destructive">{s.error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
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
        ) : (
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
          />
        )}
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
      </div>

      <IngredientsTable
        loading={s.loading}
        ingredients={s.ingredients}
        lowCount={s.lowCount}
        busyId={s.busyId}
        onEdit={s.startEdit}
        onToggleActive={(item) => void s.toggleActive(item)}
      />
      <MovementsTable movements={s.movements} />
    </div>
  );
}
