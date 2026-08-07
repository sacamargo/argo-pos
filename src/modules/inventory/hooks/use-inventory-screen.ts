import { useCallback, useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { InventoryMovementView } from "@/domain/entities/inventory";
import { DEFAULT_INVENTORY_UNIT } from "@/modules/inventory/constants/units";
import { useSessionStore } from "@/shared/hooks/use-session";

export function useInventoryScreen() {
  const user = useSessionStore((state) => state.user);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [movements, setMovements] = useState<InventoryMovementView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUnit, setNewUnit] = useState(DEFAULT_INVENTORY_UNIT);
  const [newMin, setNewMin] = useState("0");
  const [newInitial, setNewInitial] = useState("0");
  const [entryQty, setEntryQty] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const editingItem = ingredients.find((item) => item.id === editingId) ?? null;

  const reload = useCallback(async () => {
    const { inventory } = await getAppServices();
    const [ingredientRows, movementRows] = await Promise.all([
      inventory.listIngredients(),
      inventory.listMovements(40),
    ]);
    setIngredients(ingredientRows);
    setMovements(movementRows);
  }, []);

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
  }, [reload]);

  const resetCreateFields = () => {
    setEditingId(null);
    setEditOpen(false);
    setCreateOpen(false);
    setNewName("");
    setNewUnit(DEFAULT_INVENTORY_UNIT);
    setNewMin("0");
    setNewInitial("0");
    setEntryQty("");
    setEntryNote("");
    setAdjustQty("");
    setAdjustNote("");
  };

  const openCreate = () => {
    setError(null);
    setEditingId(null);
    setEditOpen(false);
    setNewName("");
    setNewUnit(DEFAULT_INVENTORY_UNIT);
    setNewMin("0");
    setNewInitial("0");
    setCreateOpen(true);
  };

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
      resetCreateFields();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el ítem");
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    if (!editingId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { inventory } = await getAppServices();
      await inventory.updateIngredient({
        id: editingId,
        name: newName,
        unit: newUnit,
        minStock: Number(newMin),
      });
      resetCreateFields();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el ítem");
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (item: Ingredient) => {
    setError(null);
    setCreateOpen(false);
    setEditingId(item.id);
    setNewName(item.name);
    setNewUnit(item.unit);
    setNewMin(String(item.minStock));
    setEntryQty("");
    setEntryNote("");
    setAdjustQty("");
    setAdjustNote("");
    setEditOpen(true);
  };

  const toggleActive = async (item: Ingredient) => {
    setBusyId(item.id);
    setError(null);
    try {
      const { inventory } = await getAppServices();
      await inventory.setIngredientActive({ id: item.id, active: !item.active });
      if (editingId === item.id) {
        resetCreateFields();
      }
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el estado");
    } finally {
      setBusyId(null);
    }
  };

  const registerEntry = async () => {
    if (!editingId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { inventory } = await getAppServices();
      await inventory.recordPurchaseIn({
        ingredientId: editingId,
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
    if (!editingId) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { inventory } = await getAppServices();
      await inventory.recordAdjustment({
        ingredientId: editingId,
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

  return {
    ingredients,
    movements,
    error,
    loading,
    busy,
    busyId,
    editingItem,
    createOpen,
    editOpen,
    newName,
    newUnit,
    newMin,
    newInitial,
    entryQty,
    entryNote,
    adjustQty,
    adjustNote,
    lowCount,
    setNewName,
    setNewUnit,
    setNewMin,
    setNewInitial,
    setEntryQty,
    setEntryNote,
    setAdjustQty,
    setAdjustNote,
    openCreate,
    createIngredient,
    saveEdit,
    startEdit,
    cancelEdit: resetCreateFields,
    toggleActive,
    registerEntry,
    registerAdjustment,
  };
}
