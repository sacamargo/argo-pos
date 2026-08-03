import type {
  ProductImageStore,
  SavedProductImage,
} from "@/domain/repositories/product-image-store";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export class ProductImageService {
  constructor(private readonly store: ProductImageStore) {}

  async saveFromFile(file: File): Promise<SavedProductImage> {
    if (!file.type.startsWith("image/")) {
      throw new Error("El archivo debe ser una imagen");
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new Error("La imagen supera el máximo de 5 MB");
    }

    const extension = file.name.includes(".")
      ? (file.name.split(".").pop() ?? "")
      : (file.type.split("/")[1] ?? "");

    const bytes = new Uint8Array(await file.arrayBuffer());
    return this.store.saveFromBytes(bytes, extension);
  }

  async getDisplaySrc(fileName: string | null | undefined): Promise<string | null> {
    if (!fileName) {
      return null;
    }
    return this.store.toDisplaySrc(fileName);
  }
}
