import { describe, expect, it } from "vitest";
import { listSalesQuerySchema } from "@/application/services/sale-query-service";
import { reverseSaleSchema } from "@/application/services/sale-service";
import { localDayBounds, todayLocalDateInput } from "@/shared/utils/date";

describe("reverseSale schema", () => {
  it("requires a reason", () => {
    const bad = reverseSaleSchema.safeParse({
      saleId: "s1",
      userId: "u1",
      role: "admin",
      reason: "no",
    });
    expect(bad.success).toBe(false);

    const ok = reverseSaleSchema.safeParse({
      saleId: "s1",
      userId: "u1",
      role: "vendedor",
      reason: "Cliente canceló",
    });
    expect(ok.success).toBe(true);
  });
});

describe("sale query schema and dates", () => {
  it("accepts day filters", () => {
    const result = listSalesQuerySchema.safeParse({
      date: "2026-08-02",
      paymentMethodId: null,
      status: "completed",
    });
    expect(result.success).toBe(true);
  });

  it("builds local day bounds", () => {
    const { fromIso, toIso } = localDayBounds("2026-08-02");
    expect(fromIso <= toIso).toBe(true);
    expect(todayLocalDateInput().length).toBe(10);
  });
});
