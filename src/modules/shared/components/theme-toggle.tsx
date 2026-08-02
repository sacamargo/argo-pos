"use client";

import { Palette } from "lucide-react";
import { Button } from "@/design-system/components/button";
import { useTheme, type Theme } from "@/modules/shared/hooks/use-theme";

const LABELS: Record<Theme, string> = {
  gris: "Gris",
  claro: "Claro",
  azul: "Azul",
};

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label={`Tema actual: ${LABELS[theme]}. Cambiar tema`}
      title={`Tema: ${LABELS[theme]}`}
      onClick={cycleTheme}
      className="h-auto min-h-10 w-[72px] flex-col gap-0.5 rounded-[var(--radius-lg)] px-1 py-1.5"
    >
      <Palette className="h-4 w-4" />
      <span className="text-[10px] font-medium">{LABELS[theme]}</span>
    </Button>
  );
}
