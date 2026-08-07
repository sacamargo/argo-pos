import type { Category } from "@/domain/entities/category";
import type { Ingredient } from "@/domain/entities/ingredient";
import { Button, Input } from "@/components";
import {
  ProductRecipeEditor,
  ProductSimpleInventoryFields,
} from "@/modules/catalog/components/product-form-sections";
import type { ProductFormState } from "@/modules/catalog/components/product-form-state";
import { ProductImage } from "@/modules/shared/components/product-image";

type ProductFormFieldsProps = {
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
  onCancel: () => void;
};

/** Formulario de producto sin Card (pensado para Modal). */
export function ProductFormFields({
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
  onCancel,
}: ProductFormFieldsProps) {
  const activeCategories = categories.filter((category) => category.active);
  const isSimple = form.fulfillmentType === "simple";
  const isEdit = Boolean(form.id);

  return (
    <div className="flex flex-col gap-3">
      <Input
        className="h-12"
        placeholder="Nombre (ej. Doritos, Granizado mora)"
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
            inventoryLinkMode: "new",
          })
        }
      >
        <option value="simple">Simple — se vende tal cual (Doritos, cerveza)</option>
        <option value="compound">Compuesto — se arma con receta (granizado)</option>
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
        <ProductSimpleInventoryFields
          form={form}
          ingredients={ingredients}
          isEdit={isEdit}
          onChange={onChange}
        />
      ) : (
        <ProductRecipeEditor form={form} ingredients={ingredients} onChange={onChange} />
      )}

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

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button className="h-12" disabled={saving || uploadingImage} onClick={onSave}>
          {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear producto"}
        </Button>
        <Button variant="outline" className="h-12" disabled={saving} onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
