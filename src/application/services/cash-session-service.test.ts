import { describe, expect, it } from "vitest";
import {
  closeCashSessionSchema,
  openCashSessionSchema,
} from "@/application/services/cash-session-service";

describe("cash session schemas", () => {
  it("accepts a valid open payload", () => {
    const result = openCashSessionSchema.safeParse({
      openedByUserId: "user-1",
      openingAmountCents: 50000,
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative opening amount", () => {
    const result = openCashSessionSchema.safeParse({
      openedByUserId: "user-1",
      openingAmountCents: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects fractional cents", () => {
    const result = openCashSessionSchema.safeParse({
      openedByUserId: "user-1",
      openingAmountCents: 10.5,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid close payload", () => {
    const result = closeCashSessionSchema.safeParse({
      closedByUserId: "user-1",
      closingAmountCents: 75000,
      note: "Cierre turno mañana",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative closing amount", () => {
    const result = closeCashSessionSchema.safeParse({
      closedByUserId: "user-1",
      closingAmountCents: -100,
    });
    expect(result.success).toBe(false);
  });
});
