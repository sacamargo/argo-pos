import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useState } from "react";
import { Badge, Button } from "@/components";
import type { HelpVisualStep } from "@/modules/help/content/types";
import { cn } from "@/shared/lib/cn";

type HelpVisualStepsProps = {
  steps: HelpVisualStep[];
};

export function HelpVisualSteps({ steps }: HelpVisualStepsProps) {
  const [index, setIndex] = useState(0);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const step = steps[index];

  if (!step || steps.length === 0) {
    return null;
  }

  const go = (delta: number) => {
    setIndex((current) => {
      const size = steps.length;
      return (current + delta + size) % size;
    });
  };

  const mediaSrc = step.mediaSrc;
  const mediaFailed = Boolean(mediaSrc && failedSrc === mediaSrc);
  const isGif = Boolean(mediaSrc?.toLowerCase().endsWith(".gif"));

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Pasos visuales</h2>
        <Badge variant="outline">
          {index + 1} / {steps.length}
        </Badge>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-muted/40">
        <div className="relative aspect-[16/10] w-full bg-card">
          {mediaSrc && !mediaFailed ? (
            <img
              key={mediaSrc}
              src={mediaSrc}
              alt={step.mediaAlt ?? step.title}
              className={cn(
                "h-full w-full object-contain p-2 transition-opacity duration-300",
                isGif ? "bg-background" : "",
              )}
              onError={() => setFailedSrc(mediaSrc)}
              draggable={false}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <ImageOff className="size-8 opacity-60" />
              <p className="text-sm font-medium text-foreground">{step.title}</p>
              <p className="max-w-md text-xs">{step.body}</p>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-border bg-card p-4">
          <div>
            <p className="text-sm font-semibold">{step.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 gap-1"
              onClick={() => go(-1)}
              disabled={steps.length < 2}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>

            <div className="flex flex-wrap justify-center gap-1.5">
              {steps.map((item, dotIndex) => (
                <button
                  key={`${item.title}-${dotIndex}`}
                  type="button"
                  aria-label={`Ir al paso ${dotIndex + 1}`}
                  className={cn(
                    "size-2.5 rounded-full transition-colors",
                    dotIndex === index ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                  onClick={() => setIndex(dotIndex)}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              className="min-h-11 gap-1"
              onClick={() => go(1)}
              disabled={steps.length < 2}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
