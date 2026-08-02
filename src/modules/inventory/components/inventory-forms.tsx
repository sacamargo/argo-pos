"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/design-system/components/button";
import { Card } from "@/design-system/components/card";
import { Input } from "@/design-system/components/input";
import {
  createIngredient,
  createInventoryMovement,
} from "@/modules/inventory/services/inventory-service";

type IngredientOption = {
  id: string;
  name: string;
  unit: string;
};

type InventoryFormsProps = {
  ingredients: IngredientOption[];
};

export function InventoryForms({ ingredients }: InventoryFormsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [movement, setMovement] = useState({
    ingredientId: ingredients[0]?.id ?? "",
    qty: "",
    reasonCode: "purchase" as "purchase" | "adjustment" | "waste",
    notes: "",
  });

  const [ingredient, setIngredient] = useState({
    name: "",
    unit: "ml" as "ml" | "g" | "unit",
    minStock: "0",
    stockTolerance: "0",
    costPerUnit: "0",
    initialQty: "0",
  });

  function runMovement() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await createInventoryMovement({
          ingredientId: movement.ingredientId,
          qty: Number(movement.qty),
          reasonCode: movement.reasonCode,
          notes: movement.notes || undefined,
        });
        setMessage("Movimiento registrado");
        setMovement((prev) => ({ ...prev, qty: "", notes: "" }));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al registrar");
      }
    });
  }

  function runCreateIngredient() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await createIngredient({
          name: ingredient.name,
          unit: ingredient.unit,
          minStock: Number(ingredient.minStock),
          stockTolerance: Number(ingredient.stockTolerance),
          costPerUnit: Number(ingredient.costPerUnit),
          initialQty: Number(ingredient.initialQty),
        });
        setMessage("Ingrediente creado");
        setIngredient({
          name: "",
          unit: "ml",
          minStock: "0",
          stockTolerance: "0",
          costPerUnit: "0",
          initialQty: "0",
        });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear");
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="space-y-3 p-5">
        <h2 className="text-lg font-semibold">Entrada / ajuste</h2>
        <label className="block space-y-1 text-sm">
          <span>Ingrediente</span>
          <select
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            value={movement.ingredientId}
            onChange={(event) =>
              setMovement((prev) => ({
                ...prev,
                ingredientId: event.target.value,
              }))
            }
          >
            {ingredients.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.unit})
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Tipo</span>
          <select
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
            value={movement.reasonCode}
            onChange={(event) =>
              setMovement((prev) => ({
                ...prev,
                reasonCode: event.target.value as
                  | "purchase"
                  | "adjustment"
                  | "waste",
              }))
            }
          >
            <option value="purchase">Compra / entrada</option>
            <option value="adjustment">Ajuste (+/−)</option>
            <option value="waste">Merma</option>
          </select>
        </label>
        <label className="block space-y-1 text-sm">
          <span>Cantidad</span>
          <Input
            type="number"
            value={movement.qty}
            onChange={(event) =>
              setMovement((prev) => ({ ...prev, qty: event.target.value }))
            }
            placeholder={
              movement.reasonCode === "adjustment" ? "Ej: 10 o -5" : "Ej: 1000"
            }
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span>Notas</span>
          <Input
            value={movement.notes}
            onChange={(event) =>
              setMovement((prev) => ({ ...prev, notes: event.target.value }))
            }
          />
        </label>
        <Button disabled={pending || !movement.ingredientId} onClick={runMovement}>
          Registrar movimiento
        </Button>
      </Card>

      <Card className="space-y-3 p-5">
        <h2 className="text-lg font-semibold">Nuevo ingrediente</h2>
        <Input
          placeholder="Nombre"
          value={ingredient.name}
          onChange={(event) =>
            setIngredient((prev) => ({ ...prev, name: event.target.value }))
          }
        />
        <select
          className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3"
          value={ingredient.unit}
          onChange={(event) =>
            setIngredient((prev) => ({
              ...prev,
              unit: event.target.value as "ml" | "g" | "unit",
            }))
          }
        >
          <option value="ml">ml</option>
          <option value="g">g</option>
          <option value="unit">unidad</option>
        </select>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Stock mínimo"
            value={ingredient.minStock}
            onChange={(event) =>
              setIngredient((prev) => ({
                ...prev,
                minStock: event.target.value,
              }))
            }
          />
          <Input
            type="number"
            placeholder="Tolerancia"
            value={ingredient.stockTolerance}
            onChange={(event) =>
              setIngredient((prev) => ({
                ...prev,
                stockTolerance: event.target.value,
              }))
            }
          />
          <Input
            type="number"
            placeholder="Costo unitario"
            value={ingredient.costPerUnit}
            onChange={(event) =>
              setIngredient((prev) => ({
                ...prev,
                costPerUnit: event.target.value,
              }))
            }
          />
          <Input
            type="number"
            placeholder="Stock inicial"
            value={ingredient.initialQty}
            onChange={(event) =>
              setIngredient((prev) => ({
                ...prev,
                initialQty: event.target.value,
              }))
            }
          />
        </div>
        <Button disabled={pending || !ingredient.name} onClick={runCreateIngredient}>
          Crear ingrediente
        </Button>
      </Card>

      {message ? (
        <p className="text-sm text-[var(--color-success)] lg:col-span-2">{message}</p>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--color-danger)] lg:col-span-2">{error}</p>
      ) : null}
    </div>
  );
}
