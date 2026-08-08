import type { Ingredient } from "@/domain/entities/ingredient";
import type { InventoryMovementView } from "@/domain/entities/inventory";
import {
  Badge,
  Button,
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

type IngredientsTableProps = {
  loading: boolean;
  ingredients: Ingredient[];
  /** Total items before search filter (for “X de Y”). */
  totalCount: number;
  searchQuery: string;
  lowCount: number;
  busyId: string | null;
  onEdit: (item: Ingredient) => void;
  onToggleActive: (item: Ingredient) => void;
  onDelete: (item: Ingredient) => void;
};

export function IngredientsTable({
  loading,
  ingredients,
  totalCount,
  searchQuery,
  lowCount,
  busyId,
  onEdit,
  onToggleActive,
  onDelete,
}: IngredientsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lo que hay en stock</CardTitle>
        <CardDescription>
          {searchQuery.trim()
            ? `${ingredients.length} de ${totalCount} ítem(s)`
            : lowCount === 0
              ? `${totalCount} ítem(s) · sin alerta de stock bajo`
              : `${totalCount} ítem(s) · ${lowCount} en alerta de stock bajo`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
        {!loading && totalCount === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay ítems. Pulsa “Agregar ítem”.
          </p>
        ) : null}
        {!loading && totalCount > 0 && ingredients.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ningún ítem coincide con “{searchQuery.trim()}”.
          </p>
        ) : null}
        {!loading && ingredients.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((item) => {
                const low = item.active && item.stockQuantity <= item.minStock;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.stockQuantity} {item.unit}
                    </TableCell>
                    <TableCell>
                      {item.minStock} {item.unit}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          !item.active ? "secondary" : low ? "destructive" : "success"
                        }
                      >
                        {!item.active ? "Oculto" : low ? "Stock bajo" : "OK"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        disabled={busyId === item.id}
                        onClick={() => onEdit(item)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={busyId === item.id}
                        onClick={() => onToggleActive(item)}
                      >
                        {item.active ? "Ocultar" : "Mostrar"}
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={busyId === item.id}
                        onClick={() => onDelete(item)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : null}
      </CardContent>
    </Card>
  );
}

type MovementsTableProps = {
  movements: InventoryMovementView[];
};

export function MovementsTable({ movements }: MovementsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de movimientos</CardTitle>
        <CardDescription>Compras y correcciones recientes</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Ítem</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead>Cantidad</TableHead>
              <TableHead>Nota</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {movements.map((movement) => (
              <TableRow key={movement.id}>
                <TableCell className="text-xs">
                  {new Date(movement.createdAt).toLocaleString("es-CO")}
                </TableCell>
                <TableCell>{movement.ingredientName}</TableCell>
                <TableCell>{movement.reasonName}</TableCell>
                <TableCell>{movement.quantity}</TableCell>
                <TableCell className="text-muted-foreground">{movement.note ?? "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
