import type { Ingredient } from "@/domain/entities/ingredient";
import type { InventoryMovementView } from "@/domain/entities/inventory";
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

type IngredientsTableProps = {
  loading: boolean;
  ingredients: Ingredient[];
  lowCount: number;
};

export function IngredientsTable({ loading, ingredients, lowCount }: IngredientsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ingredientes</CardTitle>
        <CardDescription>{lowCount} en stock bajo</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
        {!loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((item) => {
                const low = item.stockQuantity <= item.minStock;
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
                      <Badge variant={low ? "destructive" : item.active ? "success" : "secondary"}>
                        {low ? "Stock bajo" : item.active ? "OK" : "Inactivo"}
                      </Badge>
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
        <CardTitle>Historial</CardTitle>
        <CardDescription>Últimos movimientos</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Ingrediente</TableHead>
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
