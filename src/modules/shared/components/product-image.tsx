import { useEffect, useState } from "react";
import { getAppServices } from "@/application/container";
import { cn } from "@/shared/lib/cn";

type ProductImageProps = {
  imagePath: string | null | undefined;
  alt: string;
  className?: string;
};

type ResolvedImage = {
  path: string;
  url: string;
};

export function ProductImage({ imagePath, alt, className }: ProductImageProps) {
  const [resolved, setResolved] = useState<ResolvedImage | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!imagePath) {
      return;
    }

    void (async () => {
      try {
        const { productImages } = await getAppServices();
        const url = await productImages.getDisplaySrc(imagePath);
        if (!cancelled && url) {
          setResolved({ path: imagePath, url });
        }
      } catch {
        // Placeholder below covers missing/broken images.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [imagePath]);

  const src =
    resolved !== null && resolved.path === imagePath ? resolved.url : null;

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("h-full w-full object-cover", className)}
        draggable={false}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-full items-center justify-center bg-muted text-xs text-muted-foreground",
        className,
      )}
    >
      Sin imagen
    </div>
  );
}
