import type { DayCutSessionInfo } from "@/domain/entities/day-cut";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";
import { formatPesos } from "@/shared/utils/money";

function formatDateTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  return new Date(iso).toLocaleString("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type DayCutSessionsCardProps = {
  sessions: DayCutSessionInfo[];
};

export function DayCutSessionsCard({ sessions }: DayCutSessionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sesiones de caja</CardTitle>
        <CardDescription>El día operativo es la fecha local de apertura.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Apertura</TableHead>
              <TableHead>Cierre</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Abrió</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((row) => (
              <TableRow key={row.session.id}>
                <TableCell>
                  <Badge
                    variant={row.session.status === "open" ? "success" : "secondary"}
                  >
                    {row.session.status === "open" ? "Abierta" : "Cerrada"}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(row.session.openedAt)}</TableCell>
                <TableCell>{formatDateTime(row.session.closedAt)}</TableCell>
                <TableCell>{formatPesos(row.session.openingAmountCents)}</TableCell>
                <TableCell>{row.openedByUsername ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
