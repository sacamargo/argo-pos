import type { DayCutSessionInfo } from "@/domain/entities/day-cut";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
      <CardContent className="space-y-2 text-sm">
        {sessions.map((row) => (
          <div
            key={row.session.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 last:border-0"
          >
            <div className="space-y-1">
              <Badge variant={row.session.status === "open" ? "success" : "secondary"}>
                {row.session.status === "open" ? "Abierta" : "Cerrada"}
              </Badge>
              <p>
                {formatDateTime(row.session.openedAt)}
                {" → "}
                {formatDateTime(row.session.closedAt)}
              </p>
              <p className="text-muted-foreground">
                Abrió: {row.openedByUsername ?? "—"} · Base{" "}
                {formatPesos(row.session.openingAmountCents)}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
