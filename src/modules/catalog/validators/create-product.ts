import { z } from "zod";

export const createProductWizardSchema = z.object({
  productName: z.string().min(2).max(120),
  categoryId: z.uuid().optional(),
  newCategoryName: z.string().min(2).max(80).optional(),
  optionGroups: z
    .array(
      z.object({
        name: z.string().min(1).max(60),
        values: z.array(z.string().min(1).max(60)).min(1),
      }),
    )
    .min(1),
  basePrice: z.number().positive(),
  recipeItems: z
    .array(
      z.object({
        ingredientId: z.uuid(),
        qty: z.number().positive(),
      }),
    )
    .min(1),
});

export type CreateProductWizardInput = z.infer<typeof createProductWizardSchema>;
