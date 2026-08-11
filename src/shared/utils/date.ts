/** YYYY-MM-DD in local timezone for <input type="date">. */
export function todayLocalDateInput(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** True when value looks like a local calendar date YYYY-MM-DD. */
export function isLocalDateInput(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) {
    return false;
  }
  const probe = new Date(year, month - 1, day);
  return (
    probe.getFullYear() === year &&
    probe.getMonth() === month - 1 &&
    probe.getDate() === day
  );
}

/** Inclusive local-day bounds as ISO strings for comparing with created_at / opened_at. */
export function localDayBounds(dateInput: string): { fromIso: string; toIso: string } {
  if (!isLocalDateInput(dateInput)) {
    throw new Error("Fecha inválida");
  }

  const [year, month, day] = dateInput.split("-").map(Number);
  const from = new Date(year!, month! - 1, day!, 0, 0, 0, 0);
  const to = new Date(year!, month! - 1, day!, 23, 59, 59, 999);
  return { fromIso: from.toISOString(), toIso: to.toISOString() };
}

/**
 * Business / operating day of a cash session: local calendar date of openedAt.
 * Overnight shifts still belong to the open day.
 */
export function businessDateFromIso(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Timestamp inválido");
  }
  return todayLocalDateInput(date);
}
