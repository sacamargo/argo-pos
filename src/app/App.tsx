import { useEffect, useState } from "react";
import { ensureDatabaseReady, type DatabaseStatus } from "@/application/ensure-database";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";
import { AppShell } from "@/layouts/app-shell";
import { NAV_ITEMS, type AppSection } from "@/shared/constants/navigation";

export function App() {
  const [section, setSection] = useState<AppSection>("dashboard");
  const [modalOpen, setModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const active = NAV_ITEMS.find((item) => item.id === section);

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

  return (
    <AppShell activeSection={section} onNavigate={setSection}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{active?.label}</h1>
            <Badge variant="secondary">MVP</Badge>
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{active?.description}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Base de datos local</CardTitle>
            <CardDescription>
              SQLite en el directorio de la app + migraciones automáticas + seed inicial.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!dbStatus ? (
              <p className="text-sm text-muted-foreground">Inicializando SQLite…</p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={dbStatus.ready ? "success" : "destructive"}>
                    {dbStatus.ready ? "Lista" : "No lista"}
                  </Badge>
                  <Badge variant="outline">{dbStatus.runtime}</Badge>
                  <Badge variant="secondary">{dbStatus.databaseFile}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{dbStatus.message}</p>
                {dbStatus.ready ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dato</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Admin seed</TableCell>
                        <TableCell>{dbStatus.adminUsername ?? "—"}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Métodos de pago</TableCell>
                        <TableCell>{dbStatus.paymentMethodCount}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Categorías demo</TableCell>
                        <TableCell>{dbStatus.categoryCount}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Design system</CardTitle>
            <CardDescription>
              Componentes base disponibles para los módulos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input placeholder="Buscar (ejemplo de Input)" aria-label="Buscar" />
              <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={modalOpen}
        title="Modal de ejemplo"
        description="Base para cobros y confirmaciones."
        onClose={() => setModalOpen(false)}
      >
        <p className="text-sm text-muted-foreground">
          Este modal cierra con Escape, clic fuera o el botón de cerrar.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={() => setModalOpen(false)}>Entendido</Button>
        </div>
      </Modal>
    </AppShell>
  );
}
