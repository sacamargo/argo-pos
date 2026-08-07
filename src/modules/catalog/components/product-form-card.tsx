import type { Category } from "@/domain/entities/category";
import type { Ingredient } from "@/domain/entities/ingredient";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components";
import { ProductImage } from "@/modules/shared/components/product-image";
import type { ProductFormState } from "@/modules/catalog/components/product-form-state";

type ProductFormCardProps = {
  form: ProductFormState;
  categories: Category[];
  ingredients: Ingredient[];
  error: string | null;
  saving: boolean;
  uploadingImage: boolean;
  onChange: (next: ProductFormState) => void;
  onPickImage: (file: File) => void;
  onClearImage: () => void;
  onSave: () => void;
  onReset: () => void;
};

export function ProductFormCard({
  form,
  categories,
  ingredients,
  error,
  saving,
  uploadingImage,
  onChange,
  onPickImage,
  onClearImage,
  onSave,
  onReset,
}: ProductFormCardProps) {
  const activeCategories = categories.filter((category) => category.active);
  const isSimple = form.fulfillmentType === "simple";

  const addRecipeRow = () => {
    const first = ingredients[0];
    if (!first) {
      return;
    }
    onChange({
      ...form,
      recipe: [...form.recipe, { ingredientId: first.id, quantity: "1" }],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{form.id ? "Editar producto" : "Nuevo producto"}</CardTitle>
        <CardDescription>
          Simple = stock propio. Compound = receta de inventario.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          className="h-12"
          placeholder="Nombre"
          value={form.name}
          onChange={(event) => onChange({ ...form, name: event.target.value })}
        />
        <select
          className="h-12 rounded-md border border-input bg-card px-3 text-sm"
          value={form.categoryId}
          onChange={(event) => onChange({ ...form, categoryId: event.target.value })}
        >
          <option value="">Selecciona categoría</option>
          {activeCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          className="h-12 rounded-md border border-input bg-card px-3 text-sm"
          value={form.fulfillmentType}
          onChange={(event) =>
            onChange({
              ...form,
              fulfillmentType: event.target.value === "simple" ? "simple" : "compound",
              recipe: event.target.value === "simple" ? [] : form.recipe,
            })
          }
        >
          <option value="compound">Compound (receta)</option>
          <option value="simple">Simple (inventario 1:1)</option>
        </select>
        <Input
          className="h-12"
          type="number"
          min="0"
          step="1"
          placeholder="Precio (COP)"
          value={form.pricePesos}
          onChange={(event) => onChange({ ...form, pricePesos: event.target.value })}
        />

        {isSimple ? (
          <div className="space-y-2 rounded-md border border-border p-3">
            <p className="text-sm font-medium">Inventario vinculado</p>
            <select
              className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
              value={form.stockItemId}
              onChange={(event) => onChange({ ...form, stockItemId: event.target.value })}
            >
              <option value="">Selecciona ítem</option>
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name} ({ingredient.unit})
                </option>
              ))}
            </select>
            <Input
              className="h-11"
              type="number"
              min="0"
              step="0.01"
              placeholder="Cantidad por venta"
              value={form.qtyPerSale}
              onChange={(event) => onChange({ ...form, qtyPerSale: event.target.value })}
            />
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="h-28 overflow-hidden rounded-md border border-border">
            <ProductImage imagePath={form.imagePath || null} alt={form.name || "Producto"} />
          </div>
          <Input
            className="h-12"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploadingImage || saving}
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) {
                return;
              }
              onPickImage(file);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            {form.imagePath ? (
              <Button
                type="button"
                variant="ghost"
                disabled={uploadingImage || saving}
                onClick={onClearImage}
              >
                Quitar imagen
              </Button>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {uploadingImage ? "Guardando imagen…" : "Opcional · máx. 5 MB"}
            </p>
          </div>
        </div>

        {!isSimple ? (
          <div className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Receta</p>
              <Button type="button" variant="outline" onClick={addRecipeRow}>
                Agregar ítem
              </Button>
            </div>
            {form.recipe.length === 0 ? (
              <p className="text-sm text-muted-foreground">Agrega al menos un ítem.</p>
            ) : (
              form.recipe.map((item, index) => (
                <div
                  key={`${item.ingredientId}-${index}`}
                  className="flex flex-col gap-2 sm:flex-row"
                >
                  <select
                    className="h-11 flex-1 rounded-md border border-input bg-card px-3 text-sm"
                    value={item.ingredientId}
                    onChange={(event) => {
                      const recipe = [...form.recipe];
                      const currentItem = recipe[index];
                      if (!currentItem) {
                        return;
                      }
                      recipe[index] = {
                        ingredientId: event.target.value,
                        quantity: currentItem.quantity,
                      };
                      onChange({ ...form, recipe });
                    }}
                  >
                    {ingredients.map((ingredient) => (
                      <option key={ingredient.id} value={ingredient.id}>
                        {ingredient.name} ({ingredient.unit})
                      </option>
                    ))}
                  </select>
                  <Input
                    className="h-11 sm:w-28"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={(event) => {
                      const recipe = [...form.recipe];
                      const currentItem = recipe[index];
                      if (!currentItem) {
                        return;
                      }
                      recipe[index] = {
                        ingredientId: currentItem.ingredientId,
                        quantity: event.target.value,
                      };
                      onChange({ ...form, recipe });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      onChange({
                        ...form,
                        recipe: form.recipe.filter((_, i) => i !== index),
                      })
                    }
                  >
                    Quitar
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button className="h-12" disabled={saving || uploadingImage} onClick={onSave}>
            {saving ? "Guardando…" : form.id ? "Actualizar" : "Crear producto"}
          </Button>
          {form.id ? (
            <Button variant="outline" className="h-12" onClick={onReset}>
              Nuevo
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
