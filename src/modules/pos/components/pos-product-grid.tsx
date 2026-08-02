import type { Product } from "@/domain/entities/product";
import { formatPesos } from "@/shared/utils/money";

type PosProductGridProps = {
  products: Product[];
  onAdd: (product: Product) => void;
};

export function PosProductGrid({ products, onAdd }: PosProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border p-8 text-sm text-muted-foreground">
        No hay productos en esta categoría.
      </div>
    );
  }

  return (
    <div className="grid flex-1 content-start gap-3 overflow-auto sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onAdd(product)}
          className="flex min-h-36 flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-primary hover:bg-accent/40"
        >
          <div className="flex h-24 items-center justify-center bg-muted text-xs text-muted-foreground">
            {product.imagePath ? (
              <span className="truncate px-2">{product.imagePath}</span>
            ) : (
              "Sin imagen"
            )}
          </div>
          <div className="flex flex-1 flex-col justify-between gap-1 p-3">
            <span className="text-sm font-semibold leading-snug">{product.name}</span>
            <span className="text-base font-medium">{formatPesos(product.priceCents)}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
