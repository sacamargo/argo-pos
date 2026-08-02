import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/shared/utils/password";

describe("password hashing", () => {
  it("hashes and verifies a password", async () => {
    const hash = await hashPassword("admin123");
    expect(hash.startsWith("pbkdf2$")).toBe(true);
    await expect(verifyPassword("admin123", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });
});
