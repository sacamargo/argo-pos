import { useState } from "react";
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
  const active = NAV_ITEMS.find((item) => item.id === section);

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
            <CardTitle>Base de interfaz lista</CardTitle>
            <CardDescription>
              Shell, tema claro/oscuro y componentes base para construir módulos.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input placeholder="Buscar (ejemplo de Input)" aria-label="Buscar" />
              <Button onClick={() => setModalOpen(true)}>Abrir modal</Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Componente</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Button / Input / Card</TableCell>
                  <TableCell>
                    <Badge variant="success">Listo</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Modal / Table / Badge</TableCell>
                  <TableCell>
                    <Badge variant="success">Listo</Badge>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Theme toggle</TableCell>
                  <TableCell>
                    <Badge>Persistido</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
