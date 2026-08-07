import { describe, expect, it, beforeEach } from "vitest";
import { notify, useToastStore } from "@/shared/hooks/use-toast";
import {
  notifyLowStockItem,
  notifyLowStockSummary,
} from "@/shared/utils/notify-low-stock";

describe("toast notifications", () => {
  beforeEach(() => {
    useToastStore.getState().clear();
  });

  it("pushes and dedupes by id", () => {
    notify({ id: "a", title: "Uno", tone: "info" });
    notify({ id: "a", title: "Dos", tone: "warning" });
    const items = useToastStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]?.title).toBe("Dos");
    expect(items[0]?.tone).toBe("warning");
  });

  it("notifies low stock item only when at or below min", () => {
    notifyLowStockItem({
      id: "1",
      name: "Hielo",
      unit: "g",
      stockQuantity: 100,
      minStock: 50,
      active: true,
    });
    expect(useToastStore.getState().items).toHaveLength(0);

    notifyLowStockItem({
      id: "1",
      name: "Hielo",
      unit: "g",
      stockQuantity: 40,
      minStock: 50,
      active: true,
    });
    expect(useToastStore.getState().items[0]?.title).toBe("Stock bajo");
  });

  it("notifies low stock summary", () => {
    notifyLowStockSummary(0);
    expect(useToastStore.getState().items).toHaveLength(0);
    notifyLowStockSummary(3);
    expect(useToastStore.getState().items[0]?.description).toMatch(/3 ítems/);
  });
});
