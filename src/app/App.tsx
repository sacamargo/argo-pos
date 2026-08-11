import { useEffect, useState } from "react";
import { ensureDatabaseReady, type DatabaseStatus } from "@/application/ensure-database";
import { Badge } from "@/components";
import { canAccessSection } from "@/domain/services/permissions";
import { AppShell } from "@/layouts/app-shell";
import { LoginForm } from "@/modules/auth/components/login-form";
import { BackupsScreen } from "@/modules/backup/components/backups-screen";
import { CatalogScreen } from "@/modules/catalog/components/catalog-screen";
import { DayCutScreen } from "@/modules/corte/components/day-cut-screen";
import { DashboardScreen } from "@/modules/dashboard/components/dashboard-screen";
import { HelpScreen } from "@/modules/help/components/help-screen";
import { InventoryScreen } from "@/modules/inventory/components/inventory-screen";
import { PosScreen } from "@/modules/pos/components/pos-screen";
import { SalesHistoryScreen } from "@/modules/sales/components/sales-history-screen";
import { ModuleVisibilityScreen } from "@/modules/settings/components/module-visibility-screen";
import { UsersScreen } from "@/modules/users/components/users-screen";
import { PlaceholderScreen } from "@/modules/shared/components/placeholder-screen";
import { formatAppTitle } from "@/shared/constants/branding";
import { NAV_ITEMS, type AppSection } from "@/shared/constants/navigation";
import { useCashSessionStore } from "@/shared/hooks/use-cash-session";
import { useModuleVisibilityStore } from "@/shared/hooks/use-module-visibility";
import { useSessionStore } from "@/shared/hooks/use-session";
import type { PublicUser } from "@/domain/entities/user";

function SectionContent({
  section,
  user,
}: {
  section: AppSection;
  user: PublicUser;
}) {
  switch (section) {
    case "dashboard":
      return <DashboardScreen />;
    case "corte":
      return <DayCutScreen />;
    case "pos":
      return <PosScreen />;
    case "sales":
      return <SalesHistoryScreen />;
    case "catalog":
      return <CatalogScreen />;
    case "inventory":
      return <InventoryScreen />;
    case "users":
      return <UsersScreen />;
    case "settings":
      return user.role === "master" ? (
        <ModuleVisibilityScreen />
      ) : (
        <PlaceholderScreen title="Ajustes" description="Preferencias del negocio." />
      );
    case "backup":
      return <BackupsScreen />;
    case "help":
      return <HelpScreen />;
  }
}

export function App() {
  const user = useSessionStore((state) => state.user);
  const hydrated = useSessionStore((state) => state.hydrated);
  const hydrate = useSessionStore((state) => state.hydrate);
  const clearSession = useSessionStore((state) => state.clearSession);
  const moduleConfig = useModuleVisibilityStore((state) => state.config);
  const hydrateModules = useModuleVisibilityStore((state) => state.hydrate);
  const refreshCash = useCashSessionStore((state) => state.refresh);

  const [section, setSection] = useState<AppSection>("dashboard");
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    let cancelled = false;

    void ensureDatabaseReady().then((status) => {
      if (!cancelled) {
        setDbStatus(status);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user || !dbStatus?.ready) {
      return;
    }
    void hydrateModules();
    void refreshCash().catch(() => {
      // El store guarda el error; la UI de caja lo muestra.
    });
  }, [user, dbStatus?.ready, hydrateModules, refreshCash]);

  if (!hydrated || !dbStatus) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">
        Inicializando {formatAppTitle()}…
      </div>
    );
  }

  if (!dbStatus.ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <Badge variant="destructive">Base no lista</Badge>
        <p className="max-w-md text-sm text-muted-foreground">{dbStatus.message}</p>
        <p className="text-xs text-muted-foreground">
          Usa `pnpm tauri:dev` para abrir la app nativa.
        </p>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const activeSection = canAccessSection(user.role, section, moduleConfig)
    ? section
    : "dashboard";
  const active = NAV_ITEMS.find((item) => item.id === activeSection);

  return (
    <AppShell
      user={user}
      activeSection={activeSection}
      onNavigate={(next) => {
        if (canAccessSection(user.role, next, moduleConfig)) {
          setSection(next);
        }
      }}
      onLogout={clearSession}
    >
      <div className="mb-4 flex items-center gap-2 lg:hidden">
        <Badge variant="outline">{active?.label}</Badge>
      </div>
      <SectionContent section={activeSection} user={user} />
    </AppShell>
  );
}
