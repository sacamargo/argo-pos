import { z } from "zod";

export const createSaleSchema = z.object({
  paymentMethodId: z.uuid(),
  notes: z.string().max(500).optional(),
  items: z
    .array(
      z.object({
        variantId: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
  amountTendered: z.number().nonnegative().optional(),
  changeAmount: z.number().nonnegative().optional(),
});

export type CreateSaleInput = z.infer<typeof createSaleSchema>;
