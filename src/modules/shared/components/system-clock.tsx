import { useEffect, useState } from "react";

const TICK_MS = 30_000;

function formatNow(now: Date): string {
  return now.toLocaleString("es-CO", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Live clock for the shell header (visual only; not used for business day). */
export function SystemClock() {
  const [label, setLabel] = useState(() => formatNow(new Date()));

  useEffect(() => {
    const tick = () => setLabel(formatNow(new Date()));
    tick();
    const id = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <time
      className="hidden whitespace-nowrap rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground sm:inline"
      dateTime={new Date().toISOString()}
      title="Hora del sistema"
    >
      {label}
    </time>
  );
}
