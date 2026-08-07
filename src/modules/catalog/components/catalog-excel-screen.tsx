import { useRef, useState } from "react";
import { getAppServices } from "@/application/container";
import type { CatalogImportPreview } from "@/application/services/catalog-service";
import type { CatalogImportResult } from "@/application/services/catalog-import-service";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Modal,
} from "@/components";
import { downloadWorkbookBytes } from "@/modules/catalog/utils/download-workbook";
import { notify } from "@/shared/hooks/use-toast";
import { getErrorMessage } from "@/shared/utils/error-message";

export function CatalogExcelScreen() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [preview, setPreview] = useState<CatalogImportPreview | null>(null);
  const [pendingBytes, setPendingBytes] = useState<Uint8Array | null>(null);
  const [lastResult, setLastResult] = useState<CatalogImportResult | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setSuccess(null);
    try {
      await work();
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo completar la operación Excel");
      setError(message);
      notify({ tone: "error", title: "Excel", description: message });
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = () =>
    void run(async () => {
      const { catalog } = await getAppServices();
      const bytes = await catalog.buildTemplateWorkbook();
      downloadWorkbookBytes(bytes, "argo-pos-plantilla-catalogo.xlsx");
      setSuccess("Plantilla descargada.");
      notify({ tone: "success", title: "Plantilla descargada" });
    });

  const exportCatalog = () =>
    void run(async () => {
      const { catalog } = await getAppServices();
      const bytes = await catalog.exportCatalogWorkbook();
      downloadWorkbookBytes(bytes, "argo-pos-catalogo.xlsx");
      setSuccess("Catálogo exportado.");
      notify({ tone: "success", title: "Catálogo exportado" });
    });

  const onPickFile = (file: File | undefined) => {
    if (!file) {
      return;
    }
    void run(async () => {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const { catalog } = await getAppServices();
      const report = await catalog.previewImport(bytes);
      setPreview(report);
      setPendingBytes(report.valid ? bytes : null);
      setLastResult(null);
      if (!report.valid) {
        setError(`El archivo tiene ${report.errors.length} error(es). Revisa el informe.`);
        notify({
          tone: "error",
          title: "Importación inválida",
          description: `${report.errors.length} error(es) en el archivo.`,
        });
      } else {
        setSuccess("Archivo válido. Confirma para aplicar la importación.");
        setConfirmOpen(true);
        notify({
          tone: "info",
          title: "Archivo válido",
          description: "Confirma para aplicar la importación.",
        });
      }
    });
  };

  const applyImport = () =>
    void run(async () => {
      if (!pendingBytes) {
        throw new Error("No hay archivo válido pendiente de importar.");
      }
      const { catalog } = await getAppServices();
      const result = await catalog.importCatalogWorkbook(pendingBytes);
      setLastResult(result);
      setConfirmOpen(false);
      setPendingBytes(null);
      setPreview(null);
      setSuccess("Importación aplicada correctamente.");
      notify({ tone: "success", title: "Importación aplicada" });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Excel del catálogo</CardTitle>
          <CardDescription>
            Plantilla, exportación e importación. En productos usa tipo Simple o
            Compuesto. Solo admin.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Button className="h-12" disabled={busy} onClick={downloadTemplate}>
              Descargar plantilla
            </Button>
            <Button
              className="h-12"
              variant="outline"
              disabled={busy}
              onClick={exportCatalog}
            >
              Exportar catálogo
            </Button>
            <Button
              className="h-12"
              variant="outline"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              Elegir archivo…
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                onPickFile(file);
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            La importación valida primero (dry-run). Solo escribe en la base tras confirmar.
          </p>
          {busy ? <p className="text-sm text-muted-foreground">Procesando…</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{success}</p> : null}
        </CardContent>
      </Card>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Informe de validación</CardTitle>
            <CardDescription>
              {preview.valid ? "Sin errores de negocio." : "Hay errores que bloquean el apply."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Categorías {preview.summary.categories} · Inventario {preview.summary.inventory} ·
              Productos {preview.summary.products} · Recetas {preview.summary.recipes}
            </p>
            {preview.errors.length === 0 ? (
              <p className="text-sm">Todo listo para importar.</p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-auto text-sm">
                {preview.errors.map((item) => (
                  <li key={`${item.sheet}-${item.row}-${item.code}-${item.message}`}>
                    <span className="font-medium">{item.sheet}</span> fila {item.row}
                    {item.column ? ` · ${item.column}` : ""}: {item.message}
                  </li>
                ))}
              </ul>
            )}
            {preview.valid && pendingBytes ? (
              <Button className="h-11" disabled={busy} onClick={() => setConfirmOpen(true)}>
                Revisar y aplicar
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {lastResult ? (
        <Card>
          <CardHeader>
            <CardTitle>Resultado</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Categorías +{lastResult.categories.created} / ~{lastResult.categories.updated} ·
            Inventario +{lastResult.inventory.created} / ~{lastResult.inventory.updated} ·
            Productos +{lastResult.products.created} / ~{lastResult.products.updated}
          </CardContent>
        </Card>
      ) : null}

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!busy) {
            setConfirmOpen(false);
          }
        }}
        title="Confirmar importación"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Se actualizarán categorías, inventario, productos y se reemplazarán recetas
            compound según el Excel. Esta acción no se puede deshacer fácilmente.
          </p>
          {preview ? (
            <p className="text-sm">
              Filas: {preview.summary.categories} cat. · {preview.summary.inventory} inv. ·{" "}
              {preview.summary.products} prod. · {preview.summary.recipes} recetas.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button className="h-11" disabled={busy} onClick={applyImport}>
              {busy ? "Importando…" : "Aplicar importación"}
            </Button>
            <Button
              className="h-11"
              variant="outline"
              disabled={busy}
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
