import { z } from "zod";
import type { PaymentMethod, SaleWithItems } from "@/domain/entities/sale";
import type { CashSessionRepository } from "@/domain/repositories/cash-session-repository";
import type { IngredientRepository } from "@/domain/repositories/ingredient-repository";
import type { InventoryMovementRepository } from "@/domain/repositories/inventory-movement-repository";
import type { PaymentMethodRepository } from "@/domain/repositories/payment-method-repository";
import type { ProductRepository } from "@/domain/repositories/product-repository";
import type { SaleRepository } from "@/domain/repositories/sale-repository";
import type { TransactionRunner } from "@/domain/repositories/transaction-runner";
import {
  calculateChangeCents,
  cartSubtotalCents,
  cartTotalCents,
  lineTotalCents,
  type Cart,
} from "@/domain/services/cart";

const cartLineSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  unitPriceCents: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export const createSaleSchema = z.object({
  userId: z.string().min(1),
  paymentMethodId: z.string().min(1),
  cart: z.object({
    lines: z.array(cartLineSchema).min(1, "El carrito está vacío"),
    discountCents: z.number().int().min(0),
  }),
  amountTenderedCents: z.number().int().min(0).nullable().optional(),
});

export class SaleService {
  constructor(
    private readonly sales: SaleRepository,
    private readonly products: ProductRepository,
    private readonly ingredients: IngredientRepository,
    private readonly movements: InventoryMovementRepository,
    private readonly paymentMethods: PaymentMethodRepository,
    private readonly cashSessions: CashSessionRepository,
    private readonly runInTransaction: TransactionRunner,
  ) {}

  async listPaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethods.listActive();
  }

  async getSale(id: string): Promise<SaleWithItems | null> {
    return this.sales.findByIdWithItems(id);
  }

  async createSale(raw: unknown): Promise<SaleWithItems> {
    const input = createSaleSchema.parse(raw);
    const cart = input.cart as Cart;

    const openSession = await this.cashSessions.findOpen();
    if (!openSession) {
      throw new Error("No hay caja abierta. Abre la caja antes de cobrar.");
    }

    const paymentMethod = await this.paymentMethods.findById(input.paymentMethodId);
    if (!paymentMethod || !paymentMethod.active) {
      throw new Error("Método de pago inválido");
    }

    const subtotalCents = cartSubtotalCents(cart);
    const totalCents = cartTotalCents(cart);

    let amountTenderedCents: number | null = null;
    let changeCents: number | null = null;

    if (paymentMethod.code === "cash") {
      if (input.amountTenderedCents == null) {
        throw new Error("Indica el monto recibido en efectivo");
      }
      amountTenderedCents = input.amountTenderedCents;
      changeCents = calculateChangeCents(totalCents, amountTenderedCents);
    }

    const saleOutReason = await this.movements.findReasonByCode("sale_out");
    if (!saleOutReason) {
      throw new Error("Motivo de salida por venta no configurado");
    }

    type Needed = { ingredientId: string; name: string; quantity: number };
    const needs = new Map<string, Needed>();
    const resolvedItems: Array<{
      productId: string;
      productNameSnapshot: string;
      unitPriceCentsSnapshot: number;
      quantity: number;
      lineTotalCents: number;
    }> = [];

    for (const line of cart.lines) {
      const product = await this.products.findByIdWithRecipe(line.productId);
      if (!product || !product.active) {
        throw new Error(`Producto no disponible: ${line.name}`);
      }

      resolvedItems.push({
        productId: product.id,
        productNameSnapshot: product.name,
        unitPriceCentsSnapshot: product.priceCents,
        quantity: line.quantity,
        lineTotalCents: lineTotalCents({
          ...line,
          unitPriceCents: product.priceCents,
          name: product.name,
        }),
      });

      for (const recipeItem of product.recipe) {
        const required = recipeItem.quantity * line.quantity;
        const current = needs.get(recipeItem.ingredientId);
        if (current) {
          current.quantity += required;
        } else {
          const ingredient = await this.ingredients.findById(recipeItem.ingredientId);
          needs.set(recipeItem.ingredientId, {
            ingredientId: recipeItem.ingredientId,
            name: ingredient?.name ?? recipeItem.ingredientId,
            quantity: required,
          });
        }
      }
    }

    for (const need of needs.values()) {
      const ingredient = await this.ingredients.findById(need.ingredientId);
      if (!ingredient || !ingredient.active) {
        throw new Error(`Ingrediente no disponible: ${need.name}`);
      }
      if (ingredient.stockQuantity < need.quantity) {
        throw new Error(
          `Stock insuficiente de ${ingredient.name} (hay ${ingredient.stockQuantity}, se necesitan ${need.quantity})`,
        );
      }
    }

    const saleId = crypto.randomUUID();
    const createdAt = new Date().toISOString();

    await this.runInTransaction(async () => {
      await this.sales.create({
        id: saleId,
        cashSessionId: openSession.id,
        userId: input.userId,
        paymentMethodId: paymentMethod.id,
        subtotalCents,
        totalCents,
        amountTenderedCents,
        changeCents,
        createdAt,
        items: resolvedItems.map((item) => ({
          id: crypto.randomUUID(),
          ...item,
        })),
      });

      for (const need of needs.values()) {
        await this.movements.create({
          ingredientId: need.ingredientId,
          reasonId: saleOutReason.id,
          quantity: -need.quantity,
          note: `Venta ${saleId.slice(0, 8)}`,
          userId: input.userId,
          referenceType: "sale",
          referenceId: saleId,
        });
        await this.ingredients.applyStockDelta(need.ingredientId, -need.quantity);
      }
    });

    const created = await this.sales.findByIdWithItems(saleId);
    if (!created) {
      throw new Error("La venta se creó pero no se pudo leer");
    }
    return created;
  }
}
