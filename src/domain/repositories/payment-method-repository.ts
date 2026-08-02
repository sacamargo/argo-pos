import type { PaymentMethod } from "@/domain/entities/sale";

export interface PaymentMethodRepository {
  listActive(): Promise<PaymentMethod[]>;
  findById(id: string): Promise<PaymentMethod | null>;
}
