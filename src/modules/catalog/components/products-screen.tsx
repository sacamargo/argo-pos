import type { Category } from "@/domain/entities/category";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Modal,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components";
import { ProductFormFields } from "@/modules/catalog/components/product-form-fields";
import { useProductsScreen } from "@/modules/catalog/hooks/use-products-screen";
import { formatPesos } from "@/shared/utils/money";

type ProductsScreenProps = {
  categories: Category[];
};

export function ProductsScreen({ categories }: ProductsScreenProps) {
  const s = useProductsScreen(categories);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Productos</h2>
          <p className="text-sm text-muted-foreground">
            Lo que se vende en el POS. Agregar o editar abre un formulario.
          </p>
        </div>
        <Button
          className="h-11"
          onClick={s.startCreate}
          disabled={s.activeCategories.length === 0}
        >
          Agregar producto
        </Button>
      </div>

      {s.activeCategories.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Primero crea una categoría activa en la pestaña Categorías.
        </p>
      ) : null}

      {s.listError ? <p className="text-sm text-destructive">{s.listError}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
          <CardDescription>{s.products.length} producto(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {s.loading ? <p className="text-sm text-muted-foreground">Cargando…</p> : null}
          {!s.loading && s.products.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay productos. Pulsa “Agregar producto”.
            </p>
          ) : null}
          {!s.loading && s.products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {s.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.fulfillmentType === "simple" ? "Simple" : "Compuesto"} ·{" "}
                        {s.categoryName(product.categoryId)}
                        {product.imagePath ? " · Con imagen" : ""}
                      </div>
                    </TableCell>
                    <TableCell>{formatPesos(product.priceCents)}</TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "success" : "secondary"}>
                        {product.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        disabled={s.busyId === product.id}
                        onClick={() => void s.startEdit(product.id)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={s.busyId === product.id}
                        onClick={() => void s.toggleActive(product)}
                      >
                        {product.active ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : null}
        </CardContent>
      </Card>

      <Modal
        open={s.formOpen}
        title={s.form.id ? "Editar producto" : "Agregar producto"}
        description="Simple = se vende tal cual. Compuesto = se arma con receta (granizado)."
        onClose={s.closeForm}
        className="max-w-2xl"
      >
        <ProductFormFields
          form={s.form}
          categories={categories}
          ingredients={s.ingredients}
          error={s.error}
          saving={s.saving}
          uploadingImage={s.uploadingImage}
          onChange={s.setForm}
          onPickImage={(file) => void s.onPickImage(file)}
          onClearImage={() => s.setForm((current) => ({ ...current, imagePath: "" }))}
          onSave={() => void s.onSave()}
          onCancel={s.closeForm}
        />
      </Modal>
    </div>
  );
}
