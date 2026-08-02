export type CreateSaleResult = {
  saleId: string;
  publicId: string;
  total: number;
  durationMs: number;
};

export function mapCreateSaleResult(
  payload: { sale_id: string; public_id: string; total: number },
  durationMs: number,
): CreateSaleResult {
  return {
    saleId: payload.sale_id,
    publicId: payload.public_id,
    total: Number(payload.total),
    durationMs,
  };
}
