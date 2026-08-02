import {
  listIngredients,
  listRecentMovements,
} from "@/modules/inventory/services/inventory-service";
import { InventoryForms } from "@/modules/inventory/components/inventory-forms";
import { Card } from "@/design-system/components/card";
import { Badge } from "@/design-system/components/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/design-system/components/table";

export default async function InventoryPage() {
  const [ingredients, movements] = await Promise.all([
    listIngredients(),
    listRecentMovements(25),
  ]);

  return (
    <div className="h-full space-y-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Entradas y ajustes por movimientos. El stock no se edita a mano.
        </p>
      </div>

      <InventoryForms
        ingredients={ingredients.map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
        }))}
      />

      <Card className="p-2">
        <div className="px-3 py-2 text-sm font-semibold">Stock actual</div>
        <Table>
          <THead>
            <TR>
              <TH>Ingrediente</TH>
              <TH>Unidad</TH>
              <TH>Stock</TH>
              <TH>Mínimo</TH>
              <TH>Estado</TH>
            </TR>
          </THead>
          <TBody>
            {ingredients.map((item) => (
              <TR key={item.id}>
                <TD>{item.name}</TD>
                <TD>{item.unit}</TD>
                <TD>{item.stockQty}</TD>
                <TD>{item.minStock}</TD>
                <TD>
                  <Badge tone={item.isCritical ? "warning" : "success"}>
                    {item.isCritical ? "Crítico" : "OK"}
                  </Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      <Card className="p-2">
        <div className="px-3 py-2 text-sm font-semibold">
          Movimientos recientes
        </div>
        <Table>
          <THead>
            <TR>
              <TH>Fecha</TH>
              <TH>Ingrediente</TH>
              <TH>Motivo</TH>
              <TH>Cantidad</TH>
              <TH>Stock después</TH>
            </TR>
          </THead>
          <TBody>
            {movements.map((move) => (
              <TR key={move.id}>
                <TD>
                  {new Date(move.createdAt).toLocaleString("es-CO", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </TD>
                <TD>{move.ingredientName}</TD>
                <TD>{move.reasonName}</TD>
                <TD>
                  {move.qty > 0 ? "+" : ""}
                  {move.qty} {move.unit}
                </TD>
                <TD>
                  {move.stockAfter} {move.unit}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
