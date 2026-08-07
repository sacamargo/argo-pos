import { useToastStore } from "@/shared/hooks/use-toast";
import { notify } from "@/shared/hooks/use-toast";

type LowStockLike = {
  id: string;
  name: string;
  unit: string;
  stockQuantity: number;
  minStock: number;
  active: boolean;
};

/** Warning toast when an item is at or below min stock. */
export function notifyLowStockItem(item: LowStockLike | null | undefined): void {
  if (!item || !item.active) {
    return;
  }
  if (item.stockQuantity > item.minStock) {
    return;
  }
  notify({
    tone: "warning",
    id: `low-stock-item-${item.id}`,
    title: "Stock bajo",
    description: `${item.name}: ${item.stockQuantity} ${item.unit} (mín. ${item.minStock})`,
  });
}

/** Summary toast for several low-stock items. */
export function notifyLowStockSummary(
  count: number,
  options?: { id?: string; title?: string },
): void {
  if (count <= 0) {
    return;
  }
  notify({
    tone: "warning",
    id: options?.id ?? "low-stock-summary",
    title: options?.title ?? "Stock bajo",
    description:
      count === 1
        ? "1 ítem está por debajo del mínimo."
        : `${count} ítems están por debajo del mínimo.`,
  });
}

export function dismissToast(id: string): void {
  useToastStore.getState().dismiss(id);
}
