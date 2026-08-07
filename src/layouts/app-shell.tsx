import {
  Archive,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Moon,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Sun,
  Users,
  Warehouse,
} from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/button";
import { ToastViewport } from "@/components/toast-viewport";
import type { PublicUser } from "@/domain/entities/user";
import { canAccessSection } from "@/domain/services/permissions";
import { CashSessionControls } from "@/modules/cash/components/cash-session-controls";
import { BrandAvatar } from "@/modules/shared/components/brand-avatar";
import { formatAppTitle } from "@/shared/constants/branding";
import { NAV_ITEMS, type AppSection } from "@/shared/constants/navigation";
import { useThemeStore } from "@/shared/hooks/use-theme";
import { cn } from "@/shared/lib/cn";

const ICONS = {
  dashboard: LayoutDashboard,
  pos: ShoppingCart,
  sales: Receipt,
  catalog: Package,
  inventory: Warehouse,
  users: Users,
  settings: Settings,
  backup: Archive,
  help: BookOpen,
} as const;

type AppShellProps = {
  user: PublicUser;
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  onLogout: () => void;
  children: ReactNode;
};

export function AppShell({
  user,
  activeSection,
  onNavigate,
  onLogout,
  children,
}: AppShellProps) {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const visibleItems = NAV_ITEMS.filter((item) => canAccessSection(user.role, item.id));
  const activeItem = visibleItems.find((item) => item.id === activeSection);

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex min-w-0 items-center gap-3">
          <BrandAvatar size="sm" />
          <span className="truncate text-sm font-semibold tracking-tight">
            {formatAppTitle()}
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {activeItem?.label ?? "Inicio"}
          </span>
          <span className="truncate rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
            {user.username} · {user.role}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CashSessionControls compact />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Activar tema claro" : "Activar tema oscuro"}
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
          <Button variant="outline" onClick={onLogout} className="gap-2">
            <LogOut className="size-4" />
            Salir
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-card p-3">
          <nav className="flex flex-1 flex-col gap-1" aria-label="Principal">
            {visibleItems.map((item) => {
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

      <ToastViewport />
    </div>
  );
}
