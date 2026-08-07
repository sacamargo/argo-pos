import type { Ingredient } from "@/domain/entities/ingredient";
import { Button, Input } from "@/components";
import type { ProductFormState } from "@/modules/catalog/components/product-form-state";
import { UnitField } from "@/modules/inventory/components/inventory-form-fields";

type Props = {
  form: ProductFormState;
  ingredients: Ingredient[];
  isEdit: boolean;
  onChange: (next: ProductFormState) => void;
};

export function ProductSimpleInventoryFields({ form, ingredients, isEdit, onChange }: Props) {
  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <p className="text-sm font-medium">Inventario (bodega)</p>
      <p className="text-xs text-muted-foreground">
        En el mismo paso: crea el stock o reutiliza un ítem que ya exista.
      </p>
      {!isEdit ? (
        <select
          className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
          value={form.inventoryLinkMode}
          onChange={(event) =>
            onChange({
              ...form,
              inventoryLinkMode: event.target.value === "existing" ? "existing" : "new",
              stockItemId: "",
            })
          }
        >
          <option value="new">Crear ítem de inventario nuevo</option>
          <option value="existing">Usar ítem de inventario existente</option>
        </select>
      ) : null}

      {isEdit || form.inventoryLinkMode === "existing" ? (
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
      ) : (
        <div className="space-y-2">
          <UnitField
            unit={form.newInventoryUnit}
            onUnitChange={(unit) => onChange({ ...form, newInventoryUnit: unit })}
          />
          <Input
            className="h-11"
            type="number"
            min={0}
            placeholder="Avisar cuando queden pocas"
            value={form.newInventoryMin}
            onChange={(event) => onChange({ ...form, newInventoryMin: event.target.value })}
          />
          <Input
            className="h-11"
            type="number"
            min={0}
            placeholder="Cantidad inicial en bodega"
            value={form.newInventoryInitial}
            onChange={(event) =>
              onChange({ ...form, newInventoryInitial: event.target.value })
            }
          />
        </div>
      )}

      <Input
        className="h-11"
        type="number"
        min="0"
        step="0.01"
        placeholder="Cantidad que se descuenta por venta"
        value={form.qtyPerSale}
        onChange={(event) => onChange({ ...form, qtyPerSale: event.target.value })}
      />
    </div>
  );
}

type RecipeProps = {
  form: ProductFormState;
  ingredients: Ingredient[];
  onChange: (next: ProductFormState) => void;
};

export function ProductRecipeEditor({ form, ingredients, onChange }: RecipeProps) {
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
    <div className="space-y-2 rounded-md border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Receta del granizado / compuesto</p>
          <p className="text-xs text-muted-foreground">
            Cada venta descuenta todos estos insumos de la bodega.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={addRecipeRow} disabled={ingredients.length === 0}>
          Agregar ítem
        </Button>
      </div>
      {ingredients.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Primero crea los insumos en Inventario (vaso, pajita, base, dulces…).
        </p>
      ) : null}
      {form.recipe.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ejemplo: 1 vaso + 1 pajita + 250 ml de base + 3 dulces.
        </p>
      ) : (
        form.recipe.map((item, index) => (
          <div key={`${item.ingredientId}-${index}`} className="flex flex-col gap-2 sm:flex-row">
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
  );
}
