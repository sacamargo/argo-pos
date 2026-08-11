import { and, desc, eq, gte, inArray, isNotNull, isNull, lte, sql } from "drizzle-orm";
import { paymentMethods, products, saleItems, saleReversals, sales } from "@/database/schema";
import { users } from "@/database/schema/users";
import type {
  Sale,
  SaleDetail,
  SaleItem,
  SaleListItem,
  SaleReversal,
  SaleWithItems,
} from "@/domain/entities/sale";
import type {
  CashSessionSalesAggregate,
  CreateSaleRecordInput,
  CreateSaleReversalInput,
  DaySalesSummary,
  ListSalesFilter,
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

function mapReversal(row: typeof saleReversals.$inferSelect): SaleReversal {
  return {
    id: row.id,
    saleId: row.saleId,
    reason: row.reason,
    userId: row.userId,
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
          unitCostCentsSnapshot: item.unitCostCentsSnapshot,
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
      unitCostCentsSnapshot: row.unitCostCentsSnapshot,
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

  async findDetailById(id: string): Promise<SaleDetail | null> {
    const [row] = await this.db
      .select({
        sale: sales,
        paymentMethodCode: paymentMethods.code,
        paymentMethodName: paymentMethods.name,
        cashierUsername: users.username,
      })
      .from(sales)
      .innerJoin(paymentMethods, eq(sales.paymentMethodId, paymentMethods.id))
      .innerJoin(users, eq(sales.userId, users.id))
      .where(eq(sales.id, id))
      .limit(1);

    if (!row) {
      return null;
    }

    const items = await this.listItems(id);
    const reversal = await this.findReversalBySaleId(id);

    return {
      ...mapSale(row.sale),
      items,
      paymentMethodCode: row.paymentMethodCode,
      paymentMethodName: row.paymentMethodName,
      cashierUsername: row.cashierUsername,
      reversal,
    };
  }

  async list(filter: ListSalesFilter): Promise<SaleListItem[]> {
    const conditions = [
      gte(sales.createdAt, filter.fromIso),
      lte(sales.createdAt, filter.toIso),
    ];

    if (filter.paymentMethodId) {
      conditions.push(eq(sales.paymentMethodId, filter.paymentMethodId));
    }

    if (filter.status === "completed" || filter.status === "reversed") {
      conditions.push(eq(sales.status, filter.status));
    }

    const rows = await this.db
      .select({
        sale: sales,
        paymentMethodCode: paymentMethods.code,
        paymentMethodName: paymentMethods.name,
        cashierUsername: users.username,
      })
      .from(sales)
      .innerJoin(paymentMethods, eq(sales.paymentMethodId, paymentMethods.id))
      .innerJoin(users, eq(sales.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(sales.createdAt));

    return rows.map((row) => ({
      ...mapSale(row.sale),
      paymentMethodCode: row.paymentMethodCode,
      paymentMethodName: row.paymentMethodName,
      cashierUsername: row.cashierUsername,
    }));
  }

  async summarizeCompletedDay(fromIso: string, toIso: string): Promise<DaySalesSummary> {
    const dayFilter = and(
      gte(sales.createdAt, fromIso),
      lte(sales.createdAt, toIso),
      eq(sales.status, "completed"),
    );

    const [totals] = await this.db
      .select({
        salesCount: sql<number>`count(*)`.mapWith(Number),
        revenueCents: sql<number>`coalesce(sum(${sales.totalCents}), 0)`.mapWith(Number),
      })
      .from(sales)
      .where(dayFilter);

    const [units] = await this.db
      .select({
        unitsSold: sql<number>`coalesce(sum(${saleItems.quantity}), 0)`.mapWith(Number),
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(dayFilter);

    const productRows = await this.db
      .select({
        productName: saleItems.productNameSnapshot,
        quantity: sql<number>`coalesce(sum(${saleItems.quantity}), 0)`.mapWith(Number),
        revenueCents: sql<number>`coalesce(sum(${saleItems.lineTotalCents}), 0)`.mapWith(
          Number,
        ),
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(dayFilter)
      .groupBy(saleItems.productNameSnapshot)
      .orderBy(desc(sql`sum(${saleItems.quantity})`))
      .limit(5);

    const completed = await this.list({
      fromIso,
      toIso,
      status: "completed",
    });

    return {
      salesCount: totals?.salesCount ?? 0,
      revenueCents: totals?.revenueCents ?? 0,
      unitsSold: units?.unitsSold ?? 0,
      topProducts: productRows.map((row) => ({
        productName: row.productName,
        quantity: row.quantity,
        revenueCents: row.revenueCents,
      })),
      lastSale: completed[0] ?? null,
    };
  }

  async summarizeByCashSessionIds(
    sessionIds: string[],
  ): Promise<CashSessionSalesAggregate> {
    if (sessionIds.length === 0) {
      return {
        salesCount: 0,
        revenueCents: 0,
        unitsSold: 0,
        payments: [],
        soldProducts: [],
        profitLines: [],
      };
    }

    const sessionFilter = and(
      inArray(sales.cashSessionId, sessionIds),
      eq(sales.status, "completed"),
    );

    const [totals] = await this.db
      .select({
        salesCount: sql<number>`count(*)`.mapWith(Number),
        revenueCents: sql<number>`coalesce(sum(${sales.totalCents}), 0)`.mapWith(Number),
      })
      .from(sales)
      .where(sessionFilter);

    const [units] = await this.db
      .select({
        unitsSold: sql<number>`coalesce(sum(${saleItems.quantity}), 0)`.mapWith(Number),
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(sessionFilter);

    const paymentRows = await this.db
      .select({
        code: paymentMethods.code,
        name: paymentMethods.name,
        salesCount: sql<number>`count(*)`.mapWith(Number),
        totalCents: sql<number>`coalesce(sum(${sales.totalCents}), 0)`.mapWith(Number),
      })
      .from(sales)
      .innerJoin(paymentMethods, eq(sales.paymentMethodId, paymentMethods.id))
      .where(sessionFilter)
      .groupBy(paymentMethods.code, paymentMethods.name)
      .orderBy(desc(sql`sum(${sales.totalCents})`));

    const productRows = await this.db
      .select({
        productId: saleItems.productId,
        productName: sql<string>`max(${saleItems.productNameSnapshot})`.mapWith(String),
        quantity: sql<number>`coalesce(sum(${saleItems.quantity}), 0)`.mapWith(Number),
        revenueCents: sql<number>`coalesce(sum(${saleItems.lineTotalCents}), 0)`.mapWith(
          Number,
        ),
        missingCostLines: sql<number>`coalesce(sum(case when ${saleItems.unitCostCentsSnapshot} is null then 1 else 0 end), 0)`.mapWith(
          Number,
        ),
        productCostCents: sql<number | null>`max(${products.costCents})`.mapWith(
          (value) => (value === null || value === undefined ? null : Number(value)),
        ),
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .leftJoin(products, eq(saleItems.productId, products.id))
      .where(sessionFilter)
      .groupBy(saleItems.productId)
      .orderBy(
        desc(sql`sum(${saleItems.quantity})`),
        desc(sql`sum(${saleItems.lineTotalCents})`),
      );

    const profitRows = await this.db
      .select({
        unitPriceCentsSnapshot: saleItems.unitPriceCentsSnapshot,
        unitCostCentsSnapshot: saleItems.unitCostCentsSnapshot,
        quantity: saleItems.quantity,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .where(sessionFilter);

    return {
      salesCount: totals?.salesCount ?? 0,
      revenueCents: totals?.revenueCents ?? 0,
      unitsSold: units?.unitsSold ?? 0,
      payments: paymentRows.map((row) => ({
        code: row.code,
        name: row.name,
        salesCount: row.salesCount,
        totalCents: row.totalCents,
      })),
      soldProducts: productRows.map((row) => ({
        productId: row.productId,
        productName: row.productName,
        quantity: row.quantity,
        revenueCents: row.revenueCents,
        missingCostLines: row.missingCostLines,
        productCostCents: row.productCostCents,
      })),
      profitLines: profitRows.map((row) => ({
        unitPriceCentsSnapshot: row.unitPriceCentsSnapshot,
        unitCostCentsSnapshot: row.unitCostCentsSnapshot,
        quantity: row.quantity,
      })),
    };
  }

  async backfillMissingCostsForSessionIds(
    sessionIds: string[],
    productId?: string,
  ): Promise<number> {
    if (sessionIds.length === 0) {
      return 0;
    }

    const filters = [
      inArray(sales.cashSessionId, sessionIds),
      eq(sales.status, "completed"),
      isNull(saleItems.unitCostCentsSnapshot),
      isNotNull(products.costCents),
    ];
    if (productId) {
      filters.push(eq(saleItems.productId, productId));
    }

    const candidates = await this.db
      .select({
        id: saleItems.id,
        costCents: products.costCents,
      })
      .from(saleItems)
      .innerJoin(sales, eq(saleItems.saleId, sales.id))
      .innerJoin(products, eq(saleItems.productId, products.id))
      .where(and(...filters));

    for (const row of candidates) {
      if (row.costCents === null) {
        continue;
      }
      await this.db
        .update(saleItems)
        .set({ unitCostCentsSnapshot: row.costCents })
        .where(eq(saleItems.id, row.id));
    }

    return candidates.length;
  }

  async markReversed(saleId: string): Promise<Sale> {
    await this.db
      .update(sales)
      .set({ status: "reversed" })
      .where(eq(sales.id, saleId));

    const updated = await this.findSale(saleId);
    if (!updated) {
      throw new Error("Venta no encontrada tras anular");
    }
    return updated;
  }

  async createReversal(input: CreateSaleReversalInput): Promise<SaleReversal> {
    await this.db.insert(saleReversals).values({
      id: input.id,
      saleId: input.saleId,
      reason: input.reason,
      userId: input.userId,
      createdAt: input.createdAt,
    });

    const created = await this.findReversalBySaleId(input.saleId);
    if (!created) {
      throw new Error("No se pudo registrar la anulación");
    }
    return created;
  }

  async findReversalBySaleId(saleId: string): Promise<SaleReversal | null> {
    const [row] = await this.db
      .select()
      .from(saleReversals)
      .where(eq(saleReversals.saleId, saleId))
      .limit(1);

    return row ? mapReversal(row) : null;
  }

  async isProductReferenced(productId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: saleItems.id })
      .from(saleItems)
      .where(eq(saleItems.productId, productId))
      .limit(1);
    return Boolean(row);
  }

  async detachProductReferences(productId: string): Promise<number> {
    const existing = await this.db
      .select({ id: saleItems.id })
      .from(saleItems)
      .where(eq(saleItems.productId, productId));
    if (existing.length === 0) {
      return 0;
    }
    await this.db
      .update(saleItems)
      .set({ productId: null })
      .where(eq(saleItems.productId, productId));
    return existing.length;
  }

  private async findSale(id: string): Promise<Sale | null> {
    const [row] = await this.db.select().from(sales).where(eq(sales.id, id)).limit(1);
    return row ? mapSale(row) : null;
  }
}
