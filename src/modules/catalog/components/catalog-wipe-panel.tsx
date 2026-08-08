import { useState } from "react";
import { getAppServices } from "@/application/container";
import type { CatalogWipeResult } from "@/application/services/catalog-maintenance-service";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components";
import { ConfirmDestructiveModal } from "@/modules/shared/components/confirm-destructive-modal";
import { notify } from "@/shared/hooks/use-toast";
import { getErrorMessage } from "@/shared/utils/error-message";

const WIPE_PHRASE = "VACIAR";

function summarizeWipe(result: CatalogWipeResult): string {
  return `${result.productsDeleted} productos · ${result.ingredientsDeleted} inventario · ${result.categoriesDeleted} categorías`;
}

export function CatalogWipePanel() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runWipe = async () => {
    setBusy(true);
    setError(null);
    try {
      const { catalogMaintenance } = await getAppServices();
      const result = await catalogMaintenance.wipeCatalogAndInventory();
      setOpen(false);
      notify({
        tone: "success",
        title: "Catálogo e inventario vacíos",
        description: summarizeWipe(result),
      });
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo vaciar el catálogo");
      setError(message);
      notify({ tone: "error", title: "Vaciar", description: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Card className="border-destructive/40 bg-destructive/5">
        <CardHeader>
          <CardTitle>Vaciar catálogo e inventario</CardTitle>
          <CardDescription>
            Deja el negocio listo para cargar datos del cliente. Elimina productos,
            categorías, inventario y movimientos de stock. No borra usuarios ni
            settings. Las ventas conservan el nombre/precio (sin enlace al producto).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" disabled={busy} onClick={() => setOpen(true)}>
            Vaciar ahora…
          </Button>
        </CardContent>
      </Card>

      <ConfirmDestructiveModal
        open={open}
        title="Vaciar catálogo e inventario"
        description="Se eliminan productos, categorías e ítems de bodega. No se puede deshacer (haz backup antes)."
        confirmPhrase={WIPE_PHRASE}
        confirmLabel="Vaciar todo"
        busy={busy}
        error={error}
        onClose={() => {
          setOpen(false);
          setError(null);
        }}
        onConfirm={() => void runWipe()}
      >
        <p className="text-sm text-muted-foreground">
          Ideal antes de entregarle la app al cliente. Usuarios, caja y métodos de
          pago se mantienen.
        </p>
      </ConfirmDestructiveModal>
    </>
  );
}
