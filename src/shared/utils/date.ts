/** YYYY-MM-DD in local timezone for <input type="date">. */
export function todayLocalDateInput(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Inclusive local-day bounds as ISO strings for comparing with created_at. */
export function localDayBounds(dateInput: string): { fromIso: string; toIso: string } {
  const [year, month, day] = dateInput.split("-").map(Number);
  if (!year || !month || !day) {
    throw new Error("Fecha inválida");
  }

  const from = new Date(year, month - 1, day, 0, 0, 0, 0);
  const to = new Date(year, month - 1, day, 23, 59, 59, 999);
  return { fromIso: from.toISOString(), toIso: to.toISOString() };
}
