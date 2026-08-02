import { eq } from "drizzle-orm";
import { paymentMethods, saleItems, sales } from "@/database/schema";
import type { Sale, SaleItem, SaleWithItems } from "@/domain/entities/sale";
import type {
  CreateSaleRecordInput,
  SaleRepository,
} from "@/domain/repositories/sale-repository";
import type { AppDatabase } from "@/infrastructure/sqlite/client";

function mapSale(row: typeof sales.$inferSelect): Sale {
  return {
    id: row.id,
    cashSessionId: row.cashSessionId,
    userId: row.userId,
    paymentMethodId: row.paymentMethodId,
    status: row.status,
    subtotalCents: row.subtotalCents,
    totalCents: row.totalCents,
    amountTenderedCents: row.amountTenderedCents,
    changeCents: row.changeCents,
    createdAt: row.createdAt,
  };
}

export class DrizzleSaleRepository implements SaleRepository {
  constructor(private readonly db: AppDatabase) {}

  async create(input: CreateSaleRecordInput): Promise<Sale> {
    await this.db.insert(sales).values({
      id: input.id,
      cashSessionId: input.cashSessionId,
      userId: input.userId,
      paymentMethodId: input.paymentMethodId,
      status: "completed",
      subtotalCents: input.subtotalCents,
      totalCents: input.totalCents,
      amountTenderedCents: input.amountTenderedCents,
      changeCents: input.changeCents,
      createdAt: input.createdAt,
    });

    if (input.items.length > 0) {
      await this.db.insert(saleItems).values(
        input.items.map((item) => ({
          id: item.id,
          saleId: input.id,
          productId: item.productId,
          productNameSnapshot: item.productNameSnapshot,
          unitPriceCentsSnapshot: item.unitPriceCentsSnapshot,
          quantity: item.quantity,
          lineTotalCents: item.lineTotalCents,
        })),
      );
    }

    const created = await this.findSale(input.id);
    if (!created) {
      throw new Error("No se pudo crear la venta");
    }
    return created;
  }

  async listItems(saleId: string): Promise<SaleItem[]> {
    const rows = await this.db
      .select()
      .from(saleItems)
      .where(eq(saleItems.saleId, saleId));

    return rows.map((row) => ({
      id: row.id,
      saleId: row.saleId,
      productId: row.productId,
      productNameSnapshot: row.productNameSnapshot,
      unitPriceCentsSnapshot: row.unitPriceCentsSnapshot,
      quantity: row.quantity,
      lineTotalCents: row.lineTotalCents,
    }));
  }

  async findByIdWithItems(id: string): Promise<SaleWithItems | null> {
    const [row] = await this.db
      .select({
        sale: sales,
        paymentMethodCode: paymentMethods.code,
        paymentMethodName: paymentMethods.name,
      })
      .from(sales)
      .innerJoin(paymentMethods, eq(sales.paymentMethodId, paymentMethods.id))
      .where(eq(sales.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    const items = await this.listItems(id);
    return {
      ...mapSale(row.sale),
      items,
      paymentMethodCode: row.paymentMethodCode,
      paymentMethodName: row.paymentMethodName,
    };
  }

  private async findSale(id: string): Promise<Sale | null> {
    const [row] = await this.db.select().from(sales).where(eq(sales.id, id)).limit(1);
    return row ? mapSale(row) : null;
  }
}
