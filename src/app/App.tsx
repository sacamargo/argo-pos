import { useEffect, useState } from "react";
import { ensureDatabaseReady, type DatabaseStatus } from "@/application/ensure-database";
import { Badge } from "@/components";
import { canAccessSection } from "@/domain/services/permissions";
import { AppShell } from "@/layouts/app-shell";
import { LoginForm } from "@/modules/auth/components/login-form";
import { CatalogScreen } from "@/modules/catalog/components/catalog-screen";
import { DashboardScreen } from "@/modules/dashboard/components/dashboard-screen";
import { InventoryScreen } from "@/modules/inventory/components/inventory-screen";
import { PosScreen } from "@/modules/pos/components/pos-screen";
import { PlaceholderScreen } from "@/modules/shared/components/placeholder-screen";
import { NAV_ITEMS, type AppSection } from "@/shared/constants/navigation";
import { useSessionStore } from "@/shared/hooks/use-session";

function SectionContent({ section }: { section: AppSection }) {
  switch (section) {
    case "dashboard":
      return <DashboardScreen />;
    case "pos":
      return <PosScreen />;
    case "catalog":
      return <CatalogScreen />;
    case "inventory":
      return <InventoryScreen />;
    case "users":
      return (
        <PlaceholderScreen title="Usuarios" description="Cuentas admin y vendedor." />
      );
    case "settings":
      return (
        <PlaceholderScreen title="Ajustes" description="Preferencias del negocio." />
      );
    case "backup":
      return (
        <PlaceholderScreen title="Backup" description="Respaldo y restauración local." />
      );
  }
}

export function App() {
  const user = useSessionStore((state) => state.user);
  const hydrated = useSessionStore((state) => state.hydrated);
  const hydrate = useSessionStore((state) => state.hydrate);
  const clearSession = useSessionStore((state) => state.clearSession);

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

  if (!hydrated || !dbStatus) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-sm text-muted-foreground">
        Inicializando Argo POS…
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

  const activeSection = canAccessSection(user.role, section) ? section : "dashboard";
  const active = NAV_ITEMS.find((item) => item.id === activeSection);

  return (
    <AppShell
      user={user}
      activeSection={activeSection}
      onNavigate={(next) => {
        if (canAccessSection(user.role, next)) {
          setSection(next);
        }
      }}
      onLogout={clearSession}
    >
      <div className="mb-4 flex items-center gap-2 lg:hidden">
        <Badge variant="outline">{active?.label}</Badge>
      </div>
      <SectionContent section={activeSection} />
    </AppShell>
  );
}
