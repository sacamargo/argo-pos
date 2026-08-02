import { describe, expect, it } from "vitest";
import { dashboardQuerySchema } from "@/application/services/dashboard-service";

describe("dashboardQuerySchema", () => {
  it("requires role and accepts optional date", () => {
    expect(
      dashboardQuerySchema.safeParse({ role: "admin", date: "2026-08-02" }).success,
    ).toBe(true);
    expect(dashboardQuerySchema.safeParse({ role: "vendedor" }).success).toBe(true);
    expect(dashboardQuerySchema.safeParse({}).success).toBe(false);
  });
});
