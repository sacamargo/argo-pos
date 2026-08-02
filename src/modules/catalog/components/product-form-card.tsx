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
import type { ProductFormState } from "@/modules/catalog/components/product-form-state";

type ProductFormCardProps = {
  form: ProductFormState;
  categories: Category[];
  ingredients: Ingredient[];
  error: string | null;
  saving: boolean;
  onChange: (next: ProductFormState) => void;
  onSave: () => void;
  onReset: () => void;
};

export function ProductFormCard({
  form,
  categories,
  ingredients,
  error,
  saving,
  onChange,
  onSave,
  onReset,
}: ProductFormCardProps) {
  const activeCategories = categories.filter((category) => category.active);

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
          Precio en pesos. Receta opcional con cantidades por venta.
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
        <Input
          className="h-12"
          type="number"
          min="0"
          step="1"
          placeholder="Precio (COP)"
          value={form.pricePesos}
          onChange={(event) => onChange({ ...form, pricePesos: event.target.value })}
        />
        <div className="space-y-2">
          <Input
            className="h-12"
            placeholder="Ruta de imagen (opcional)"
            value={form.imagePath}
            onChange={(event) => onChange({ ...form, imagePath: event.target.value })}
          />
          <Input
            className="h-12"
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }
              onChange({ ...form, imagePath: file.name });
            }}
          />
          <p className="text-xs text-muted-foreground">
            El selector guarda el nombre del archivo; FE-004 lo moverá a datos de la app.
          </p>
        </div>

        <div className="space-y-2 rounded-md border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">Receta</p>
            <Button type="button" variant="outline" onClick={addRecipeRow}>
              Agregar ítem
            </Button>
          </div>
          {form.recipe.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin ingredientes (válido para extras).
            </p>
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
                      recipe: form.recipe.filter(
                        (_, recipeIndex) => recipeIndex !== index,
                      ),
                    })
                  }
                >
                  Quitar
                </Button>
              </div>
            ))
          )}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button className="h-12" disabled={saving} onClick={onSave}>
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
