import { useCallback, useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import type { PaymentMethod, SaleDetail, SaleListItem } from "@/domain/entities/sale";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
} from "@/components";
import { SaleDetailModal } from "@/modules/sales/components/sale-detail-modal";
import { useSessionStore } from "@/shared/hooks/use-session";
import { notify } from "@/shared/hooks/use-toast";
import { todayLocalDateInput } from "@/shared/utils/date";
import { getErrorMessage } from "@/shared/utils/error-message";
import { formatPesos } from "@/shared/utils/money";

export function SalesHistoryScreen() {
  const user = useSessionStore((state) => state.user);
  const [date, setDate] = useState(todayLocalDateInput);
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "reversed">("all");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [rows, setRows] = useState<SaleListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<SaleDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const { saleQueries } = await getAppServices();
    const list = await saleQueries.list({
      date,
      paymentMethodId: paymentMethodId || null,
      status,
    });
    setRows(list);
  }, [date, paymentMethodId, status]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const { saleQueries } = await getAppServices();
        const methodRows = await saleQueries.listPaymentMethods();
        if (!cancelled) {
          setMethods(methodRows);
        }
        await reload();
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "No se pudo cargar el historial"));
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

  const openDetail = async (id: string) => {
    setReverseError(null);
    try {
      const { saleQueries } = await getAppServices();
      const detail = await saleQueries.getDetail(id);
      if (!detail) {
        setError("Venta no encontrada");
        return;
      }
      setSelected(detail);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo abrir el detalle"));
    }
  };

  const reverse = async (reason: string) => {
    if (!user || !selected) {
      return;
    }
    setBusy(true);
    setReverseError(null);
    try {
      const { sales } = await getAppServices();
      const detail = await sales.reverseSale({
        saleId: selected.id,
        userId: user.id,
        role: user.role,
        reason,
      });
      setSelected(detail);
      await reload();
      notify({
        tone: "warning",
        title: "Venta anulada",
        description: formatPesos(detail.totalCents),
      });
    } catch (err) {
      const message = getErrorMessage(err, "No se pudo anular");
      setReverseError(message);
      notify({ tone: "error", title: "Anular venta", description: message });
    } finally {
      setBusy(false);
    }
  };

  const completedTotal = rows
    .filter((row) => row.status === "completed")
    .reduce((sum, row) => sum + row.totalCents, 0);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Ventas</h1>
        <p className="text-sm text-muted-foreground">
          Historial del día con filtro por pago y estado.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Fecha</span>
          <Input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="w-44"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Pago</span>
          <select
            className="flex h-11 w-44 rounded-md border border-input bg-card px-3 text-sm"
            value={paymentMethodId}
            onChange={(event) => setPaymentMethodId(event.target.value)}
          >
            <option value="">Todos</option>
            {methods.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-muted-foreground">Estado</span>
          <select
            className="flex h-11 w-40 rounded-md border border-input bg-card px-3 text-sm"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "all" | "completed" | "reversed")
            }
          >
            <option value="all">Todas</option>
            <option value="completed">Completadas</option>
            <option value="reversed">Anuladas</option>
          </select>
        </label>
        <Button
          variant="outline"
          onClick={() => {
            setLoading(true);
            void reload().finally(() => setLoading(false));
          }}
        >
          Actualizar
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {rows.length} ventas · Completadas {formatPesos(completedTotal)}
      </p>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay ventas para estos filtros.</p>
      ) : null}

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => void openDetail(row.id)}
            className="w-full text-left"
          >
            <Card className="transition-colors hover:border-primary">
              <CardContent className="flex min-h-14 items-center justify-between gap-3 py-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">
                      {new Date(row.createdAt).toLocaleTimeString("es-CO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <Badge variant="outline">{row.paymentMethodName}</Badge>
                    <Badge
                      variant={row.status === "completed" ? "success" : "destructive"}
                    >
                      {row.status === "completed" ? "OK" : "Anulada"}
                    </Badge>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {row.cashierUsername} · {row.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
                <span className="shrink-0 text-base font-semibold">
                  {formatPesos(row.totalCents)}
                </span>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {selected && user ? (
        <SaleDetailModal
          sale={selected}
          user={user}
          busy={busy}
          error={reverseError}
          onClose={() => {
            if (!busy) {
              setSelected(null);
              setReverseError(null);
            }
          }}
          onReverse={(reason) => void reverse(reason)}
        />
      ) : null}
    </div>
  );
}
