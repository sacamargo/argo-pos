import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";
import type { ModuleVisibilityConfig } from "@/domain/entities/module-visibility";
import type { ManagedNavRole } from "@/domain/entities/module-visibility";
import { NAV_ITEMS } from "@/shared/constants/navigation";
import { notify } from "@/shared/hooks/use-toast";
import { useModuleVisibilityStore } from "@/shared/hooks/use-module-visibility";
import { getErrorMessage } from "@/shared/utils/error-message";

const ROLES: Array<{ id: ManagedNavRole; label: string }> = [
  { id: "admin", label: "Admin" },
  { id: "vendedor", label: "Vendedor" },
];

export function ModuleVisibilityScreen() {
  const config = useModuleVisibilityStore((state) => state.config);
  const save = useModuleVisibilityStore((state) => state.save);
  const [draft, setDraft] = useState<ModuleVisibilityConfig>(config);
  const [busy, setBusy] = useState(false);

  const toggle = (role: ManagedNavRole, sectionId: (typeof NAV_ITEMS)[number]["id"]) => {
    setDraft((current) => ({
      ...current,
      [role]: {
        ...current[role],
        [sectionId]: !current[role][sectionId],
      },
    }));
  };

  const onSave = async () => {
    setBusy(true);
    try {
      await save(draft);
      notify({ tone: "success", title: "Módulos actualizados" });
    } catch (err) {
      notify({
        tone: "error",
        title: "No se pudo guardar",
        description: getErrorMessage(err, "Error al guardar módulos"),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Módulos visibles</h1>
        <p className="text-sm text-muted-foreground">
          Solo master. Define qué ve Admin y Vendedor en el menú. Tú siempre ves todo.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {ROLES.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <CardTitle>{role.label}</CardTitle>
              <CardDescription>Marca los módulos permitidos</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {NAV_ITEMS.map((item) => (
                <label
                  key={item.id}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border px-3"
                >
                  <input
                    type="checkbox"
                    className="size-4"
                    checked={draft[role.id][item.id]}
                    onChange={() => toggle(role.id, item.id)}
                    disabled={busy}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Button disabled={busy} onClick={() => void onSave()}>
          {busy ? "Guardando…" : "Guardar cambios"}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setDraft(config)}
        >
          Descartar
        </Button>
      </div>
    </div>
  );
}
