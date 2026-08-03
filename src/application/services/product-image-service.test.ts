import { describe, expect, it, vi } from "vitest";
import { ProductImageService } from "@/application/services/product-image-service";
import type { ProductImageStore } from "@/domain/repositories/product-image-store";

function createStore(): ProductImageStore {
  return {
    saveFromBytes: vi.fn(async () => ({
      fileName: "abc.jpg",
      path: "/tmp/abc.jpg",
      sizeBytes: 12,
    })),
    toDisplaySrc: vi.fn(async () => "asset://local/abc.jpg"),
  };
}

describe("ProductImageService", () => {
  it("rejects non-image files", async () => {
    const service = new ProductImageService(createStore());
    const file = new File(["x"], "notes.txt", { type: "text/plain" });
    await expect(service.saveFromFile(file)).rejects.toThrow(/imagen/i);
  });

  it("rejects oversized images", async () => {
    const service = new ProductImageService(createStore());
    const bytes = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([bytes], "big.png", { type: "image/png" });
    await expect(service.saveFromFile(file)).rejects.toThrow(/5 MB/i);
  });

  it("saves valid image bytes via store", async () => {
    const store = createStore();
    const service = new ProductImageService(store);
    const file = new File([new Uint8Array([1, 2, 3])], "taco.png", { type: "image/png" });
    const saved = await service.saveFromFile(file);
    expect(saved.fileName).toBe("abc.jpg");
    expect(store.saveFromBytes).toHaveBeenCalledOnce();
  });

  it("returns null display src when no path", async () => {
    const service = new ProductImageService(createStore());
    await expect(service.getDisplaySrc(null)).resolves.toBeNull();
  });
});
