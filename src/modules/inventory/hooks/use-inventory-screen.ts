import { useCallback, useEffect, useRef, useState } from "react";
import { getAppServices } from "@/application/container";
import type { Ingredient } from "@/domain/entities/ingredient";
import type { InventoryMovementView } from "@/domain/entities/inventory";
import { DEFAULT_INVENTORY_UNIT } from "@/modules/inventory/constants/units";
import { notify } from "@/shared/hooks/use-toast";
import { useSessionStore } from "@/shared/hooks/use-session";
import {
  notifyLowStockItem,
  notifyLowStockSummary,
} from "@/shared/utils/notify-low-stock";

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
  const lowStockNotified = useRef(false);

  const editingItem = ingredients.find((item) => item.id === editingId) ?? null;

  const reload = useCallback(async () => {
    const { inventory } = await getAppServices();
    const [ingredientRows, movementRows] = await Promise.all([
      inventory.listIngredients(),
      inventory.listMovements(40),
    ]);
    setIngredients(ingredientRows);
    setMovements(movementRows);
    return ingredientRows;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reload();
      } catch {
        if (!cancelled) {
          const message = "No se pudo cargar el inventario.";
          setError(message);
          notify({ tone: "error", title: "Inventario", description: message });
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

  const lowCount = ingredients.filter(
    (item) => item.active && item.stockQuantity <= item.minStock,
  ).length;

  useEffect(() => {
    if (loading || lowStockNotified.current || lowCount === 0) {
      return;
    }
    lowStockNotified.current = true;
    notifyLowStockSummary(lowCount, {
      id: "inventory-low-stock",
      title: "Stock bajo en bodega",
    });
  }, [loading, lowCount]);

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
      const created = await inventory.createIngredient({
        name: newName,
        unit: newUnit,
        minStock: Number(newMin),
        initialStock: Number(newInitial) || 0,
      });
      resetCreateFields();
      await reload();
      notify({ tone: "success", title: "Ítem creado", description: created.name });
      notifyLowStockItem(created);
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear el ítem";
      setError(message);
      notify({ tone: "error", title: "No se pudo crear", description: message });
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
      const updated = await inventory.updateIngredient({
        id: editingId,
        name: newName,
        unit: newUnit,
        minStock: Number(newMin),
      });
      resetCreateFields();
      await reload();
      notify({ tone: "success", title: "Ítem actualizado", description: updated.name });
      notifyLowStockItem(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo actualizar el ítem";
      setError(message);
      notify({ tone: "error", title: "No se pudo guardar", description: message });
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
      notify({
        tone: "success",
        title: item.active ? "Ítem oculto" : "Ítem visible",
        description: item.name,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo cambiar el estado";
      setError(message);
      notify({ tone: "error", title: "Inventario", description: message });
    } finally {
      setBusyId(null);
    }
  };

  const deleteIngredient = async (item: Ingredient) => {
    setBusyId(item.id);
    setError(null);
    try {
      const { catalogMaintenance } = await getAppServices();
      await catalogMaintenance.deleteIngredient({ id: item.id });
      if (editingId === item.id) {
        resetCreateFields();
      }
      await reload();
      notify({
        tone: "success",
        title: "Ítem eliminado",
        description: item.name,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo eliminar el ítem";
      setError(message);
      notify({ tone: "error", title: "Eliminar inventario", description: message });
      throw err;
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
      const updated = await inventory.recordPurchaseIn({
        ingredientId: editingId,
        quantity: Number(entryQty),
        note: entryNote || undefined,
        userId: user?.id,
      });
      setEntryQty("");
      setEntryNote("");
      await reload();
      notify({
        tone: "success",
        title: "Stock sumado",
        description: `${updated.name}: ${updated.stockQuantity} ${updated.unit}`,
      });
      notifyLowStockItem(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo registrar la entrada";
      setError(message);
      notify({ tone: "error", title: "Entrada de stock", description: message });
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
      const updated = await inventory.recordAdjustment({
        ingredientId: editingId,
        quantity: Number(adjustQty),
        note: adjustNote,
        userId: user?.id,
      });
      setAdjustQty("");
      setAdjustNote("");
      await reload();
      notify({
        tone: "success",
        title: "Corrección registrada",
        description: `${updated.name}: ${updated.stockQuantity} ${updated.unit}`,
      });
      notifyLowStockItem(updated);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo registrar el ajuste";
      setError(message);
      notify({ tone: "error", title: "Corrección de stock", description: message });
    } finally {
      setBusy(false);
    }
  };

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
    deleteIngredient,
    registerEntry,
    registerAdjustment,
  };
}
