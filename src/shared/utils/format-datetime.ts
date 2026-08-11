/** Format cash opening / closing timestamps consistently (es-CO). */
export function formatCashDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  });
}
