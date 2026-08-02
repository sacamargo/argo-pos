"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/design-system/components/button";
import { Input } from "@/design-system/components/input";
import { updateVariantPrice } from "@/modules/catalog/services/catalog-service";
import { formatMoney } from "@/modules/pos/utils/format";

type VariantPriceEditorProps = {
  variantId: string;
  currentPrice: number;
};

export function VariantPriceEditor({
  variantId,
  currentPrice,
}: VariantPriceEditorProps) {
  const router = useRouter();
  const [price, setPrice] = useState(String(currentPrice));
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        className="text-left font-medium hover:underline"
        onClick={() => setEditing(true)}
      >
        {formatMoney(currentPrice)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        className="h-9 w-28"
        value={price}
        onChange={(event) => setPrice(event.target.value)}
      />
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            await updateVariantPrice({
              variantId,
              price: Number(price),
            });
            setEditing(false);
            router.refresh();
          });
        }}
      >
        OK
      </Button>
    </div>
  );
}
