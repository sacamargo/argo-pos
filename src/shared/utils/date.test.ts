import { describe, expect, it } from "vitest";
import {
  businessDateFromIso,
  isLocalDateInput,
  localDayBounds,
  todayLocalDateInput,
} from "@/shared/utils/date";

describe("date utils — business day", () => {
  it("formats today as YYYY-MM-DD local", () => {
    const fixed = new Date(2026, 7, 8, 16, 30, 0);
    expect(todayLocalDateInput(fixed)).toBe("2026-08-08");
  });

  it("validates local date inputs", () => {
    expect(isLocalDateInput("2026-08-08")).toBe(true);
    expect(isLocalDateInput("2026-02-30")).toBe(false);
    expect(isLocalDateInput("08-08-2026")).toBe(false);
  });

  it("builds inclusive local day bounds as ISO", () => {
    const { fromIso, toIso } = localDayBounds("2026-08-08");
    const from = new Date(fromIso);
    const to = new Date(toIso);
    expect(todayLocalDateInput(from)).toBe("2026-08-08");
    expect(todayLocalDateInput(to)).toBe("2026-08-08");
    expect(from.getHours()).toBe(0);
    expect(from.getMinutes()).toBe(0);
    expect(to.getHours()).toBe(23);
    expect(to.getMinutes()).toBe(59);
  });

  it("assigns overnight session to the open local day", () => {
    // sábado 8 ago 2026 16:30 local
    const openedLocal = new Date(2026, 7, 8, 16, 30, 0);
    // domingo 9 ago 2026 05:00 local
    const closedLocal = new Date(2026, 7, 9, 5, 0, 0);

    expect(businessDateFromIso(openedLocal.toISOString())).toBe("2026-08-08");
    expect(businessDateFromIso(closedLocal.toISOString())).toBe("2026-08-09");

    const { fromIso, toIso } = localDayBounds("2026-08-08");
    const openedIso = openedLocal.toISOString();
    expect(openedIso >= fromIso && openedIso <= toIso).toBe(true);

    const closedIso = closedLocal.toISOString();
    expect(closedIso >= fromIso && closedIso <= toIso).toBe(false);
  });

  it("keeps same-day session on that day", () => {
    const opened = new Date(2026, 7, 8, 16, 30, 0).toISOString();
    const closed = new Date(2026, 7, 8, 23, 0, 0).toISOString();
    expect(businessDateFromIso(opened)).toBe("2026-08-08");
    expect(businessDateFromIso(closed)).toBe("2026-08-08");
  });

  it("assigns session opened near midnight to the open day", () => {
    const opened = new Date(2026, 7, 8, 23, 50, 0).toISOString();
    const afterMidnight = new Date(2026, 7, 9, 0, 10, 0).toISOString();
    expect(businessDateFromIso(opened)).toBe("2026-08-08");
    expect(businessDateFromIso(afterMidnight)).toBe("2026-08-09");
  });

  it("rejects invalid date input for bounds", () => {
    expect(() => localDayBounds("nope")).toThrow("Fecha inválida");
  });
});
