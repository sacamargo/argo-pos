import { useCallback, useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { BackupRecord } from "@/domain/entities/backup";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Modal,
} from "@/components";
import { getErrorMessage } from "@/shared/utils/error-message";
import { notify } from "@/shared/hooks/use-toast";

function formatBytes(size: number | null): string {
  if (size == null) {
    return "—";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  return `${(size / 1024).toFixed(1)} KB`;
}

export function BackupsScreen() {
  const [rows, setRows] = useState<BackupRecord[]>([]);
  const [latest, setLatest] = useState<BackupRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [step, setStep] = useState<1 | 2>(1);

  const reload = useCallback(async () => {
    const { backups } = await getAppServices();
    const [list, last] = await Promise.all([backups.listRecent(30), backups.getLatest()]);
    setRows(list);
    setLatest(last);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await reload();
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "No se pudieron cargar los backups"));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const createBackup = async () => {
    setBusy(true);
    setError(null);
    try {
      const { backups } = await getAppServices();
      await backups.createBackup({ note: note.trim() || undefined });
      setNote("");
      await reload();
      notify({ tone: "success", title: "Backup creado" });
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo crear el backup");
      setError(message);
      notify({ tone: "error", title: "Backup", description: message });
    } finally {
      setBusy(false);
    }
  };

  const restore = async () => {
    if (!restoreTarget) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { backups } = await getAppServices();
      await backups.restoreBackup({
        backupId: restoreTarget.id,
        confirmPhrase,
      });
      notify({
        tone: "success",
        title: "Restauración iniciada",
        description: "La app puede necesitar reinicio.",
      });
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo restaurar");
      setError(message);
      notify({ tone: "error", title: "Restaurar backup", description: message });
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Backups</h1>
        <p className="text-sm text-muted-foreground">
          Copia local de la base SQLite. También se crea uno al cerrar caja.
        </p>
      </div>

      {latest ? (
        <Badge variant="outline">
          Último: {new Date(latest.createdAt).toLocaleString("es-CO")}
        </Badge>
      ) : (
        <Badge variant="secondary">Sin backups aún</Badge>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Crear backup</CardTitle>
          <CardDescription>Copia el archivo de la base en AppConfig/backups</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 space-y-1 text-sm">
            <span className="font-medium">Nota (opcional)</span>
            <Input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
              maxLength={200}
            />
          </label>
          <Button disabled={busy} onClick={() => void createBackup()}>
            {busy ? "Respaldando…" : "Backup ahora"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>Restaurar reemplaza la base actual y reinicia la app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
          {!loading && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay backups registrados.</p>
          ) : null}
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">
                  {new Date(row.createdAt).toLocaleString("es-CO")}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {row.note ?? "Sin nota"} · {formatBytes(row.sizeBytes)}
                </p>
              </div>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() => {
                  setRestoreTarget(row);
                  setConfirmPhrase("");
                  setStep(1);
                }}
              >
                Restaurar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Modal
        open={Boolean(restoreTarget)}
        title="Restaurar backup"
        description="Esta acción reemplaza todos los datos actuales."
        onClose={() => {
          if (!busy) {
            setRestoreTarget(null);
            setStep(1);
            setConfirmPhrase("");
          }
        }}
      >
        <div className="flex flex-col gap-4">
          {step === 1 ? (
            <>
              <p className="text-sm text-muted-foreground">
                Se perderán ventas y cambios posteriores a este backup. ¿Continuar?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRestoreTarget(null)}>
                  Cancelar
                </Button>
                <Button variant="destructive" onClick={() => setStep(2)}>
                  Sí, continuar
                </Button>
              </div>
            </>
          ) : (
            <>
              <label className="space-y-1 text-sm">
                <span className="font-medium">Escribe RESTAURAR para confirmar</span>
                <Input
                  value={confirmPhrase}
                  onChange={(event) => setConfirmPhrase(event.target.value)}
                  disabled={busy}
                  autoComplete="off"
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setStep(1);
                    setConfirmPhrase("");
                  }}
                >
                  Atrás
                </Button>
                <Button
                  variant="destructive"
                  disabled={busy || confirmPhrase !== "RESTAURAR"}
                  onClick={() => void restore()}
                >
                  {busy ? "Restaurando…" : "Confirmar restore"}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
