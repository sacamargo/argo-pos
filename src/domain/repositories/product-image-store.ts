export type SavedProductImage = {
  fileName: string;
  path: string;
  sizeBytes: number;
};

export type ProductImageStore = {
  saveFromBytes(bytes: Uint8Array, extension: string): Promise<SavedProductImage>;
  toDisplaySrc(fileName: string): Promise<string | null>;
};
