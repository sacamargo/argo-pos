import { z } from "zod";
import type { PaymentMethod, SaleDetail, SaleListItem } from "@/domain/entities/sale";
import type { PaymentMethodRepository } from "@/domain/repositories/payment-method-repository";
import type { SaleRepository } from "@/domain/repositories/sale-repository";
import { localDayBounds, todayLocalDateInput } from "@/shared/utils/date";

export const listSalesQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida")
    .optional(),
  paymentMethodId: z.string().min(1).nullable().optional(),
  status: z.enum(["completed", "reversed", "all"]).optional(),
});

export class SaleQueryService {
  constructor(
    private readonly sales: SaleRepository,
    private readonly paymentMethods: PaymentMethodRepository,
  ) {}

  async listPaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethods.listActive();
  }

  async list(raw: unknown = {}): Promise<SaleListItem[]> {
    const input = listSalesQuerySchema.parse(raw ?? {});
    const date = input.date ?? todayLocalDateInput();
    const { fromIso, toIso } = localDayBounds(date);

    return this.sales.list({
      fromIso,
      toIso,
      paymentMethodId: input.paymentMethodId ?? null,
      status: input.status ?? "all",
    });
  }

  async getDetail(id: string): Promise<SaleDetail | null> {
    if (!id) {
      throw new Error("Id de venta obligatorio");
    }
    return this.sales.findDetailById(id);
  }
}
