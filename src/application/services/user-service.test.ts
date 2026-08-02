import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  createUserSchema,
  setUserActiveSchema,
} from "@/application/services/user-service";

describe("user service schemas", () => {
  it("accepts valid create payload", () => {
    const result = createUserSchema.safeParse({
      username: "caja01",
      password: "secreto1",
      role: "vendedor",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short password and bad username", () => {
    expect(
      createUserSchema.safeParse({
        username: "ab",
        password: "123",
        role: "admin",
      }).success,
    ).toBe(false);
  });

  it("accepts setActive and changePassword", () => {
    expect(
      setUserActiveSchema.safeParse({ id: "u1", active: false }).success,
    ).toBe(true);
    expect(
      changePasswordSchema.safeParse({ id: "u1", password: "nueva12" }).success,
    ).toBe(true);
  });
});
