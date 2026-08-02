"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/design-system/components/button";
import { Card } from "@/design-system/components/card";
import { Input } from "@/design-system/components/input";
import { createProductWithVariants } from "@/modules/catalog/services/catalog-service";

type Category = { id: string; name: string };
type Ingredient = { id: string; name: string; unit: string };

type CreateProductFormProps = {
  categories: Category[];
  ingredients: Ingredient[];
};

export function CreateProductForm({
  categories,
  ingredients,
}: CreateProductFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [productName, setProductName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [groupName, setGroupName] = useState("Tamaño");
  const [groupValues, setGroupValues] = useState("S, M, L, XL");
  const [group2Name, setGroup2Name] = useState("Sabor");
  const [group2Values, setGroup2Values] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [ingredientId, setIngredientId] = useState(ingredients[0]?.id ?? "");
  const [recipeQty, setRecipeQty] = useState("1");

  function submit() {
    setError(null);
    setMessage(null);

    const groups = [
      {
        name: groupName.trim(),
        values: groupValues
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      },
    ];

    if (group2Values.trim()) {
      groups.push({
        name: group2Name.trim() || "Opción 2",
        values: group2Values
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      });
    }

    startTransition(async () => {
      try {
        const result = await createProductWithVariants({
          productName: productName.trim(),
          categoryId: newCategoryName.trim() ? undefined : categoryId || undefined,
          newCategoryName: newCategoryName.trim() || undefined,
          optionGroups: groups,
          basePrice: Number(basePrice),
          recipeItems: [
            {
              ingredientId,
              qty: Number(recipeQty),
            },
          ],
        });
        setMessage(
          `Producto creado con ${result.variantsCreated} variantes`,
        );
        setProductName("");
        setGroup2Values("");
        setBasePrice("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo crear");
      }
    });
  }

  return (
    <Card className="space-y-3 p-5">
      <h2 className="text-lg font-semibold">Crear producto</h2>
      <Input
        placeholder="Nombre del producto (ej. Granizado)"
        value={productName}
        onChange={(event) => setProductName(event.target.value)}
      />

      <div className="grid gap-2 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span>Categoría existente</span>
          <select
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={Boolean(newCategoryName.trim())}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span>O nueva categoría</span>
          <Input
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
            placeholder="Opcional"
          />
        </label>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <Input
          placeholder="Grupo 1 (ej. Tamaño)"
          value={groupName}
          onChange={(event) => setGroupName(event.target.value)}
        />
        <Input
          placeholder="Valores separados por coma"
          value={groupValues}
          onChange={(event) => setGroupValues(event.target.value)}
        />
        <Input
          placeholder="Grupo 2 (opcional)"
          value={group2Name}
          onChange={(event) => setGroup2Name(event.target.value)}
        />
        <Input
          placeholder="Valores grupo 2 (opcional)"
          value={group2Values}
          onChange={(event) => setGroup2Values(event.target.value)}
        />
      </div>

      <Input
        type="number"
        placeholder="Precio base por variante"
        value={basePrice}
        onChange={(event) => setBasePrice(event.target.value)}
      />

      <div className="grid gap-2 md:grid-cols-2">
        <select
          className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
          value={ingredientId}
          onChange={(event) => setIngredientId(event.target.value)}
        >
          {ingredients.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.unit})
            </option>
          ))}
        </select>
        <Input
          type="number"
          placeholder="Cantidad receta"
          value={recipeQty}
          onChange={(event) => setRecipeQty(event.target.value)}
        />
      </div>

      <Button
        disabled={pending || !productName || !basePrice || !ingredientId}
        onClick={submit}
      >
        {pending ? "Creando…" : "Crear producto y variantes"}
      </Button>

      {message ? (
        <p className="text-sm text-[var(--color-success)]">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      ) : null}
    </Card>
  );
}
