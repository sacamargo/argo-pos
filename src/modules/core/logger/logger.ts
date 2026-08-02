export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.info(`[argo-pos] ${message}`, meta ?? "");
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(`[argo-pos] ${message}`, meta ?? "");
  },
};
