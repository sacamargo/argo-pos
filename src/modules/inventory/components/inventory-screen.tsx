import { useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { InventoryMovementView } from "@/domain/entities/inventory";
import {
  CreateIngredientForm,
  MovementForms,
} from "@/modules/inventory/components/inventory-forms";
import {
  IngredientsTable,
  MovementsTable,
} from "@/modules/inventory/components/inventory-tables";
import { useSessionStore } from "@/shared/hooks/use-session";

export function InventoryScreen() {
  const user = useSessionStore((state) => state.user);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [movements, setMovements] = useState<InventoryMovementView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState("ml");
  const [newMin, setNewMin] = useState("0");
  const [newInitial, setNewInitial] = useState("0");

  const [selectedId, setSelectedId] = useState("");
  const [entryQty, setEntryQty] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const reload = async () => {
    const { inventory } = await getAppServices();
    const [ingredientRows, movementRows] = await Promise.all([
      inventory.listIngredients(),
      inventory.listMovements(40),
    ]);
    setIngredients(ingredientRows);
    setMovements(movementRows);
    setSelectedId((current) => current || ingredientRows[0]?.id || "");
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reload();
      } catch {
        if (!cancelled) {
          setError("No se pudo cargar el inventario.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const createIngredient = async () => {
    setBusy(true);
    setError(null);
    try {
      const { inventory } = await getAppServices();
      await inventory.createIngredient({
        name: newName,
        unit: newUnit,
        minStock: Number(newMin),
        initialStock: Number(newInitial) || 0,
      });
      setNewName("");
      setNewUnit("ml");
      setNewMin("0");
      setNewInitial("0");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el ingrediente");
    } finally {
      setBusy(false);
    }
  };

  const registerEntry = async () => {
    setBusy(true);
    setError(null);
    try {
      const { inventory } = await getAppServices();
      await inventory.recordPurchaseIn({
        ingredientId: selectedId,
        quantity: Number(entryQty),
        note: entryNote || undefined,
        userId: user?.id,
      });
      setEntryQty("");
      setEntryNote("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la entrada");
    } finally {
      setBusy(false);
    }
  };

  const registerAdjustment = async () => {
    setBusy(true);
    setError(null);
    try {
      const { inventory } = await getAppServices();
      await inventory.recordAdjustment({
        ingredientId: selectedId,
        quantity: Number(adjustQty),
        note: adjustNote,
        userId: user?.id,
      });
      setAdjustQty("");
      setAdjustNote("");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar el ajuste");
    } finally {
      setBusy(false);
    }
  };

  const lowCount = ingredients.filter(
    (item) => item.active && item.stockQuantity <= item.minStock,
  ).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
        <p className="text-sm text-muted-foreground">
          El stock solo cambia con movimientos (entrada o ajuste).
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <CreateIngredientForm
          busy={busy}
          name={newName}
          unit={newUnit}
          minStock={newMin}
          initialStock={newInitial}
          onNameChange={setNewName}
          onUnitChange={setNewUnit}
          onMinChange={setNewMin}
          onInitialChange={setNewInitial}
          onSubmit={() => void createIngredient()}
        />
        <MovementForms
          busy={busy}
          ingredients={ingredients}
          selectedId={selectedId}
          entryQty={entryQty}
          entryNote={entryNote}
          adjustQty={adjustQty}
          adjustNote={adjustNote}
          onSelect={setSelectedId}
          onEntryQty={setEntryQty}
          onEntryNote={setEntryNote}
          onAdjustQty={setAdjustQty}
          onAdjustNote={setAdjustNote}
          onEntry={() => void registerEntry()}
          onAdjust={() => void registerAdjustment()}
        />
      </div>

      <IngredientsTable loading={loading} ingredients={ingredients} lowCount={lowCount} />
      <MovementsTable movements={movements} />
    </div>
  );
}
