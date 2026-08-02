export class AppError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export function toAppError(error: unknown, fallback = "UNEXPECTED_ERROR"): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(fallback, error.message);
  return new AppError(fallback, "Unexpected error");
}
