import {
  Archive,
  LayoutDashboard,
  Moon,
  Package,
  Settings,
  ShoppingCart,
  Sun,
  Users,
  Warehouse,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/button";
import { NAV_ITEMS, type AppSection } from "@/shared/constants/navigation";
import { useThemeStore } from "@/shared/hooks/use-theme";
import { cn } from "@/shared/lib/cn";

const ICONS = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  catalog: Package,
  inventory: Warehouse,
  users: Users,
  settings: Settings,
  backup: Archive,
} as const;

type AppShellProps = {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  children: ReactNode;
};

export function AppShell({ activeSection, onNavigate, children }: AppShellProps) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const activeItem = NAV_ITEMS.find((item) => item.id === activeSection);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight">Argo POS</span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {activeItem?.label ?? "Inicio"}
          </span>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
        >
          {theme === "dark" ? <Sun /> : <Moon />}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card p-3">
          <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
            {NAV_ITEMS.map((item) => {
              const Icon = ICONS[item.id];
              const isActive = item.id === activeSection;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-md px-3 text-left text-sm transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
