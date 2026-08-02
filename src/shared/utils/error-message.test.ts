import { describe, expect, it } from "vitest";
import { getErrorMessage } from "@/shared/utils/error-message";

describe("getErrorMessage", () => {
  it("reads Error and string throws from Tauri", () => {
    expect(getErrorMessage(new Error("caja cerrada"), "fallback")).toBe("caja cerrada");
    expect(getErrorMessage("database is locked", "fallback")).toBe("database is locked");
    expect(getErrorMessage({ message: "Failed query: commit" }, "fallback")).toBe(
      "Failed query: commit",
    );
  });

  it("uses fallback when empty", () => {
    expect(getErrorMessage(null, "No se pudo cobrar")).toBe("No se pudo cobrar");
  });
});
