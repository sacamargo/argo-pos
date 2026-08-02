import {
  listCategories,
  listVariants,
} from "@/modules/catalog/services/catalog-service";
import { listIngredients } from "@/modules/inventory/services/inventory-service";
import { CreateProductForm } from "@/modules/catalog/components/create-product-form";
import { VariantPriceEditor } from "@/modules/catalog/components/variant-price-editor";
import { Card } from "@/design-system/components/card";
import { Badge } from "@/design-system/components/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/design-system/components/table";

export default async function CatalogPage() {
  const [variants, categories, ingredients] = await Promise.all([
    listVariants(),
    listCategories(),
    listIngredients(),
  ]);

  return (
    <div className="h-full space-y-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Crea productos y ajusta precios sin perder historial.
        </p>
      </div>

      <CreateProductForm
        categories={categories}
        ingredients={ingredients.map((item) => ({
          id: item.id,
          name: item.name,
          unit: item.unit,
        }))}
      />

      <Card className="p-2">
        <Table>
          <THead>
            <TR>
              <TH>Producto</TH>
              <TH>Variante</TH>
              <TH>SKU</TH>
              <TH>Precio</TH>
              <TH>Estado</TH>
            </TR>
          </THead>
          <TBody>
            {variants.map((variant) => (
              <TR key={variant.id}>
                <TD>{variant.productName}</TD>
                <TD>{variant.label}</TD>
                <TD>{variant.sku ?? "—"}</TD>
                <TD>
                  <VariantPriceEditor
                    variantId={variant.id}
                    currentPrice={variant.price}
                  />
                </TD>
                <TD>
                  <Badge tone={variant.isActive ? "success" : "neutral"}>
                    {variant.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
