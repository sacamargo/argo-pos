/**
 * Formats unknown thrown values from Tauri IPC / Zod / Error.
 * plugin-sql often rejects with plain strings or `{ message }` objects.
 */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error == null) {
    return fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string" &&
    (error as { message: string }).message.trim()
  ) {
    return (error as { message: string }).message;
  }

  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== "{}" && serialized !== "null") {
      return serialized;
    }
  } catch {
    // ignore
  }

  return fallback;
}
