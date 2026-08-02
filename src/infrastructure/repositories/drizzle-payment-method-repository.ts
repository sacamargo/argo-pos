import { asc, eq } from "drizzle-orm";
import { paymentMethods } from "@/database/schema";
import type { PaymentMethod } from "@/domain/entities/sale";
import type { PaymentMethodRepository } from "@/domain/repositories/payment-method-repository";
import type { AppDatabase } from "@/infrastructure/sqlite/client";

function mapRow(row: {
  id: string;
  name: string;
  code: string;
  active: boolean;
  sortOrder: number;
}): PaymentMethod {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}

export class DrizzlePaymentMethodRepository implements PaymentMethodRepository {
  constructor(private readonly db: AppDatabase) {}

  async listActive(): Promise<PaymentMethod[]> {
    const rows = await this.db
      .select({
        id: paymentMethods.id,
        name: paymentMethods.name,
        code: paymentMethods.code,
        active: paymentMethods.active,
        sortOrder: paymentMethods.sortOrder,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.active, true))
      .orderBy(asc(paymentMethods.sortOrder), asc(paymentMethods.name));

    return rows.map(mapRow);
  }

  async findById(id: string): Promise<PaymentMethod | null> {
    const [row] = await this.db
      .select({
        id: paymentMethods.id,
        name: paymentMethods.name,
        code: paymentMethods.code,
        active: paymentMethods.active,
        sortOrder: paymentMethods.sortOrder,
      })
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .limit(1);

    return row ? mapRow(row) : null;
  }
}
