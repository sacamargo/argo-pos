import { useMemo, useState } from "react";
import type { Ingredient } from "@/domain/entities/ingredient";
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
import { ConfirmDestructiveModal } from "@/modules/shared/components/confirm-destructive-modal";
import { ListSearchInput } from "@/modules/shared/components/list-search-input";
import { matchesNameSearch } from "@/shared/utils/name-search";

export function InventoryScreen() {
  const s = useInventoryScreen();
  const [query, setQuery] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Ingredient | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        <Button className="h-11" onClick={s.openCreate}>
          Agregar ítem
        </Button>
      </div>

      {s.error && !s.createOpen && !s.editOpen && !pendingDelete ? (
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
        onDelete={(item) => {
          setDeleteError(null);
          setPendingDelete(item);
        }}
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
        description="Datos del ítem y movimientos de stock (compra o corrección)."
        onClose={s.cancelEdit}
        className="max-w-xl"
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
            stockSection={
              <MovementForms
                busy={s.busy}
                item={s.editingItem}
                entryQty={s.entryQty}
                entryNote={s.entryNote}
                adjustQty={s.adjustQty}
                adjustNote={s.adjustNote}
                onEntryQty={s.setEntryQty}
                onEntryNote={s.setEntryNote}
                onAdjustQty={s.setAdjustQty}
                onAdjustNote={s.setAdjustNote}
                onEntry={() => void s.registerEntry()}
                onAdjust={() => void s.registerAdjustment()}
              />
            }
          />
        ) : null}
      </Modal>

      <ConfirmDestructiveModal
        open={Boolean(pendingDelete)}
        title="Eliminar ítem de inventario"
        description="Desaparece de la bodega y se borran sus movimientos de stock."
        confirmPhrase="ELIMINAR"
        confirmLabel="Eliminar ítem"
        busy={s.busyId === pendingDelete?.id}
        error={deleteError}
        onClose={() => {
          setPendingDelete(null);
          setDeleteError(null);
        }}
        onConfirm={() => {
          if (!pendingDelete) {
            return;
          }
          void s
            .deleteIngredient(pendingDelete)
            .then(() => {
              setPendingDelete(null);
              setDeleteError(null);
            })
            .catch((err: unknown) => {
              setDeleteError(
                err instanceof Error ? err.message : "No se pudo eliminar",
              );
            });
        }}
      >
        {pendingDelete ? (
          <p className="text-sm font-medium">{pendingDelete.name}</p>
        ) : null}
      </ConfirmDestructiveModal>
    </div>
  );
}
