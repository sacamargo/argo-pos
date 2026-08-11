import { describe, expect, it } from "vitest";
import { lineProfitCents, summarizeProfit } from "@/domain/services/profit";

describe("profit", () => {
  it("calcula ganancia de línea con costo", () => {
    expect(
      lineProfitCents({
        unitPriceCentsSnapshot: 10_000,
        unitCostCentsSnapshot: 6_000,
        quantity: 2,
      }),
    ).toBe(8_000);
  });

  it("línea sin costo retorna null", () => {
    expect(
      lineProfitCents({
        unitPriceCentsSnapshot: 10_000,
        unitCostCentsSnapshot: null,
        quantity: 1,
      }),
    ).toBeNull();
  });

  it("permite costo cero", () => {
    expect(
      lineProfitCents({
        unitPriceCentsSnapshot: 5_000,
        unitCostCentsSnapshot: 0,
        quantity: 1,
      }),
    ).toBe(5_000);
  });

  it("resume ganancia parcial cuando faltan costos", () => {
    const summary = summarizeProfit([
      {
        unitPriceCentsSnapshot: 10_000,
        unitCostCentsSnapshot: 6_000,
        quantity: 2,
      },
      {
        unitPriceCentsSnapshot: 3_000,
        unitCostCentsSnapshot: null,
        quantity: 1,
      },
    ]);
    expect(summary.profitCents).toBe(8_000);
    expect(summary.missingCostLines).toBe(1);
    expect(summary.isComplete).toBe(false);
  });

  it("marca ganancia completa cuando todas las líneas tienen costo", () => {
    const summary = summarizeProfit([
      {
        unitPriceCentsSnapshot: 10_000,
        unitCostCentsSnapshot: 6_000,
        quantity: 1,
      },
    ]);
    expect(summary.isComplete).toBe(true);
    expect(summary.missingCostLines).toBe(0);
  });
});
