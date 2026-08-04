import { useState } from "react";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";
import { HELP_MODULES } from "@/modules/help/content/modules";
import { cn } from "@/shared/lib/cn";

function audienceLabel(audience: (typeof HELP_MODULES)[number]["audience"]): string {
  switch (audience) {
    case "admin":
      return "Solo admin";
    case "vendedor+admin":
      return "Admin y vendedor";
    default:
      return "Todos";
  }
}

export function HelpScreen() {
  const [activeId, setActiveId] = useState(HELP_MODULES[0]?.id ?? "login");
  const active = HELP_MODULES.find((module) => module.id === activeId) ?? HELP_MODULES[0];

  if (!active) {
    return null;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tutorial</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Guía por módulo: qué hace cada pantalla, qué espera cada campo y qué hace cada
          botón. Úsala para capacitar al equipo antes de operar en caja.
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[16rem_1fr]">
        <nav
          className="flex max-h-[40vh] flex-col gap-1 overflow-auto rounded-lg border border-border bg-card p-2 lg:max-h-none"
          aria-label="Módulos del tutorial"
        >
          {HELP_MODULES.map((module) => {
            const selected = module.id === active.id;
            return (
              <button
                key={module.id}
                type="button"
                onClick={() => setActiveId(module.id)}
                className={cn(
                  "min-h-11 rounded-md px-3 py-2 text-left text-sm transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <span className="block font-medium">{module.title}</span>
                <span
                  className={cn(
                    "block text-xs",
                    selected ? "text-primary-foreground/80" : "text-muted-foreground",
                  )}
                >
                  {audienceLabel(module.audience)}
                </span>
              </button>
            );
          })}
        </nav>

        <Card className="min-h-0 overflow-auto">
          <CardHeader className="gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">{active.title}</CardTitle>
              <Badge variant="secondary">{audienceLabel(active.audience)}</Badge>
            </div>
            <CardDescription className="text-sm leading-relaxed">
              {active.summary}
            </CardDescription>
            <p className="text-sm text-foreground">
              <span className="font-medium">Cuándo usarlo: </span>
              {active.whenToUse}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {active.fields.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold tracking-tight">Campos</h2>
                <ul className="space-y-2">
                  {active.fields.map((field) => (
                    <li
                      key={field.name}
                      className="rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{field.name}</p>
                      <p className="text-muted-foreground">
                        <span className="font-medium text-foreground">Espera: </span>
                        {field.expects}
                      </p>
                      {field.notes ? (
                        <p className="mt-1 text-xs text-muted-foreground">{field.notes}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {active.actions.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold tracking-tight">Botones y acciones</h2>
                <ul className="space-y-2">
                  {active.actions.map((action) => (
                    <li
                      key={action.name}
                      className="rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <p className="font-medium">{action.name}</p>
                      <p className="text-muted-foreground">{action.does}</p>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {active.tips && active.tips.length > 0 ? (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold tracking-tight">Tips</h2>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {active.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
