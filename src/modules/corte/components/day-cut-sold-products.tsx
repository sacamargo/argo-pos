import { useState } from "react";
import type { DayCutSoldProduct } from "@/domain/entities/day-cut";
import {
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
import { formatPesos } from "@/shared/utils/money";

const PAGE_SIZE = 6;

type DayCutSoldProductsProps = {
  products: DayCutSoldProduct[];
  canEditCost: boolean;
  busy: boolean;
  onSaveCost: (productId: string, costPesos: number) => Promise<void>;
};

export function DayCutSoldProducts({
  products,
  canEditCost,
  busy,
  onSaveCost,
}: DayCutSoldProductsProps) {
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<DayCutSoldProduct | null>(null);
  const [costPesos, setCostPesos] = useState("");
  const [saving, setSaving] = useState(false);

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = products.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);
  const totalUnits = products.reduce((sum, row) => sum + row.quantity, 0);

  const openEdit = (product: DayCutSoldProduct) => {
    setEditing(product);
    setCostPesos(
      product.productCostCents === null
        ? ""
        : String(Math.round(product.productCostCents / 100)),
    );
  };

  const closeEdit = () => {
    if (saving) {
      return;
    }
    setEditing(null);
    setCostPesos("");
  };

  const submit = async () => {
    if (!editing?.productId) {
      return;
    }
    const pesos = Number(costPesos);
    if (!Number.isFinite(pesos) || pesos < 0) {
      return;
    }
    setSaving(true);
    try {
      await onSaveCost(editing.productId, pesos);
      setEditing(null);
      setCostPesos("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Productos vendidos</CardTitle>
          <CardDescription>
            {products.length === 0
              ? "Sin ventas en la jornada."
              : `${products.length} producto${products.length === 1 ? "" : "s"} · ${totalUnits} unidades`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 overflow-x-auto">
          {products.length === 0 ? null : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Ingresos</TableHead>
                    <TableHead>Costo</TableHead>
                    {canEditCost ? <TableHead /> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageRows.map((product) => {
                    const needsCost =
                      product.missingCostLines > 0 || product.productCostCents === null;
                    const rowKey = `${product.productId ?? "x"}:${product.productName}`;
                    return (
                      <TableRow key={rowKey}>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{formatPesos(product.revenueCents)}</TableCell>
                        <TableCell>
                          {needsCost ? (
                            <span className="text-sm font-medium text-destructive">
                              Sin precio de compra
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {formatPesos(product.productCostCents ?? 0)}
                            </span>
                          )}
                        </TableCell>
                        {canEditCost ? (
                          <TableCell className="text-right">
                            {product.productId && needsCost ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy || saving}
                                onClick={() => openEdit(product)}
                              >
                                Editar costo
                              </Button>
                            ) : null}
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {products.length > PAGE_SIZE ? (
                <div className="flex flex-wrap items-center justify-center gap-1 pt-1">
                  {Array.from({ length: pageCount }, (_, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant={index === safePage ? "default" : "ghost"}
                      className="min-w-9 px-2"
                      onClick={() => setPage(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Modal
        open={editing !== null}
        title={editing ? `Precio de compra · ${editing.productName}` : "Precio de compra"}
        description="Se guarda en el producto y se aplica a las ventas de este día que aún no tenían costo."
        onClose={closeEdit}
      >
        <div className="space-y-4">
          <Input
            className="h-12"
            type="number"
            min="0"
            step="1"
            placeholder="Precio de compra (COP)"
            value={costPesos}
            onChange={(event) => setCostPesos(event.target.value)}
            disabled={saving}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={saving} onClick={closeEdit}>
              Cancelar
            </Button>
            <Button
              disabled={
                saving ||
                costPesos.trim() === "" ||
                !Number.isFinite(Number(costPesos)) ||
                Number(costPesos) < 0
              }
              onClick={() => void submit()}
            >
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
