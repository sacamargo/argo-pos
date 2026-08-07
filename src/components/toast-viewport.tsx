import {
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/button";
import {
  useToastStore,
  type ToastItem,
  type ToastTone,
} from "@/shared/hooks/use-toast";
import { cn } from "@/shared/lib/cn";

const TONE_ICON: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-5" aria-hidden />,
  warning: <AlertTriangle className="size-5" aria-hidden />,
  error: <XCircle className="size-5" aria-hidden />,
  info: <Info className="size-5" aria-hidden />,
};

const TONE_STYLES: Record<ToastTone, string> = {
  success: "border-success/30 text-success",
  warning: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  error: "border-destructive/40 text-destructive",
  info: "border-primary/30 text-primary",
};

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [dismiss, toast.durationMs, toast.id]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-auto flex w-full gap-3 rounded-xl border bg-card/95 p-3.5 shadow-lg backdrop-blur-md",
        "animate-[toast-in_180ms_ease-out]",
        TONE_STYLES[toast.tone],
      )}
    >
      <div className="mt-0.5 shrink-0">{TONE_ICON[toast.tone]}</div>
      <div className="min-w-0 flex-1 space-y-0.5 text-foreground">
        <p className="text-sm font-semibold tracking-tight">{toast.title}</p>
        {toast.description ? (
          <p className="text-xs text-muted-foreground">{toast.description}</p>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0 text-muted-foreground"
        aria-label="Cerrar notificación"
        onClick={() => dismiss(toast.id)}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

/** Mac-style stack: top-right, above modals (z-60). */
export function ToastViewport() {
  const items = useToastStore((state) => state.items);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[min(100vw-2rem,22rem)] flex-col gap-2"
      aria-label="Notificaciones"
    >
      {items.map((toast) => (
        <ToastCard key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
