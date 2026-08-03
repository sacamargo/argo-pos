import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import type {
  ProductImageStore,
  SavedProductImage,
} from "@/domain/repositories/product-image-store";
import { isTauriRuntime } from "@/infrastructure/sqlite/client";

type NativeProductImage = {
  fileName: string;
  path: string;
  sizeBytes: number;
};

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);
const imageSrcCache = new Map<string, string>();

function normalizeExtension(extension: string): string {
  const cleaned = extension.trim().replace(/^\./, "").toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(cleaned)) {
    throw new Error("Formato de imagen no soportado (usa jpg, png, webp o gif)");
  }
  return cleaned === "jpeg" ? "jpg" : cleaned;
}

export class TauriProductImageStore implements ProductImageStore {
  async saveFromBytes(bytes: Uint8Array, extension: string): Promise<SavedProductImage> {
    if (!isTauriRuntime()) {
      throw new Error("Las imágenes solo se pueden guardar en la app de escritorio");
    }

    const ext = normalizeExtension(extension);
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const result = await invoke<NativeProductImage>("save_product_image", {
      fileName,
      bytes: Array.from(bytes),
    });

    return {
      fileName: result.fileName,
      path: result.path,
      sizeBytes: result.sizeBytes,
    };
  }

  async toDisplaySrc(fileName: string): Promise<string | null> {
    if (!fileName || !isTauriRuntime()) {
      return null;
    }

    const cached = imageSrcCache.get(fileName);
    if (cached) {
      return cached;
    }

    try {
      const absolutePath = await invoke<string>("resolve_product_image", { fileName });
      const src = convertFileSrc(absolutePath);
      imageSrcCache.set(fileName, src);
      return src;
    } catch {
      return null;
    }
  }
}
