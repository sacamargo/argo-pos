import type { Category } from "@/domain/entities/category";
import { cn } from "@/shared/lib/cn";

type PosCategoriesProps = {
  categories: Category[];
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
};

export function PosCategories({ categories, selectedId, onSelect }: PosCategoriesProps) {
  return (
    <aside className="flex h-full min-h-0 w-44 shrink-0 flex-col gap-2 overflow-auto border-r border-border pr-3">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={cn(
          "min-h-12 rounded-md px-3 text-left text-sm font-medium transition-colors",
          selectedId === null
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground hover:bg-accent",
        )}
      >
        Todos
      </button>
      {categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onSelect(category.id)}
          className={cn(
            "min-h-12 rounded-md px-3 text-left text-sm font-medium transition-colors",
            selectedId === category.id
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground hover:bg-accent",
          )}
        >
          {category.name}
        </button>
      ))}
    </aside>
  );
}
