import { describe, expect, it } from "vitest";
import { formatCashDateTime } from "@/shared/utils/format-datetime";

describe("formatCashDateTime", () => {
  it("formats in es-CO with weekday and time", () => {
    const label = formatCashDateTime(new Date(2026, 7, 8, 16, 30, 0).toISOString());
    expect(label.toLowerCase()).toMatch(/agosto/);
    expect(label).toMatch(/4:30|16:30/);
  });
});
