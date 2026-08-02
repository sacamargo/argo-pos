import { useEffect, useMemo, useState } from "react";
import { getAppServices } from "@/application/container";
import type { Category } from "@/domain/entities/category";
import type { Product } from "@/domain/entities/product";
import type { PaymentMethod, SaleWithItems } from "@/domain/entities/sale";
import {
  addProduct,
  emptyCart,
  removeLine,
  setDiscount,
  setQuantity,
  type Cart,
} from "@/domain/services/cart";
import { Badge } from "@/components";
import { PaymentModal, SaleSuccessModal } from "@/modules/pos/components/payment-modal";
import { PosCart } from "@/modules/pos/components/pos-cart";
import { PosCategories } from "@/modules/pos/components/pos-categories";
import { PosProductGrid } from "@/modules/pos/components/pos-product-grid";
import { useSessionStore } from "@/shared/hooks/use-session";
import { getErrorMessage } from "@/shared/utils/error-message";

export function PosScreen() {
  const user = useSessionStore((state) => state.user);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart>(emptyCart());
  const [loading, setLoading] = useState(true);
  const [cashOpen, setCashOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<SaleWithItems | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const services = await getAppServices();
        const [categoryRows, productRows, methodRows, openSession] = await Promise.all([
          services.categories.listActive(),
          services.products.listActive(),
          services.sales.listPaymentMethods(),
          services.cashSessions.getOpenSession(),
        ]);
        if (cancelled) {
          return;
        }
        setCategories(categoryRows);
        setProducts(productRows);
        setMethods(methodRows);
        setCashOpen(Boolean(openSession));
      } catch {
        if (!cancelled) {
          setError("No se pudo cargar el POS.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleProducts = useMemo(
    () =>
      categoryId
        ? products.filter((product) => product.categoryId === categoryId)
        : products,
    [products, categoryId],
  );

  const charge = async (
    paymentMethodId: string,
    amountTenderedCents: number | null,
  ) => {
    if (!user || busy) {
      return;
    }
    setBusy(true);
    setPayError(null);
    try {
      const { sales, cashSessions } = await getAppServices();
      const openSession = await cashSessions.getOpenSession();
      if (!openSession) {
        setCashOpen(false);
        throw new Error("No hay caja abierta. Abre la caja antes de cobrar.");
      }
      const sale = await sales.createSale({
        userId: user.id,
        paymentMethodId,
        cart,
        amountTenderedCents,
      });
      setCart(emptyCart());
      setPayOpen(false);
      setSuccess(sale);
    } catch (err) {
      setPayError(getErrorMessage(err, "No se pudo cobrar"));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Cargando POS…</p>;
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] min-h-[28rem] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-semibold tracking-tight">POS</h1>
        <Badge variant={cashOpen ? "success" : "destructive"}>
          {cashOpen ? "Caja abierta" : "Caja cerrada"}
        </Badge>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>

      {!cashOpen ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          Abre la caja desde el header o el dashboard para poder cobrar.
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 gap-0">
        <PosCategories
          categories={categories}
          selectedId={categoryId}
          onSelect={setCategoryId}
        />
        <div className="min-h-0 min-w-0 flex-1 px-3">
          <PosProductGrid
            products={visibleProducts}
            onAdd={(product) => setCart((current) => addProduct(current, product))}
          />
        </div>
        <PosCart
          cart={cart}
          busy={busy}
          onIncrement={(productId) =>
            setCart((current) => {
              const line = current.lines.find((item) => item.productId === productId);
              return line
                ? setQuantity(current, productId, line.quantity + 1)
                : current;
            })
          }
          onDecrement={(productId) =>
            setCart((current) => {
              const line = current.lines.find((item) => item.productId === productId);
              return line
                ? setQuantity(current, productId, line.quantity - 1)
                : current;
            })
          }
          onRemove={(productId) => setCart((current) => removeLine(current, productId))}
          onDiscountChange={(discountCents) =>
            setCart((current) => setDiscount(current, discountCents))
          }
          onPay={() => {
            setPayError(null);
            setPayOpen(true);
          }}
        />
      </div>

      {payOpen ? (
        <PaymentModal
          open
          busy={busy}
          error={payError}
          cart={cart}
          methods={methods}
          onClose={() => {
            if (!busy) {
              setPayOpen(false);
              setPayError(null);
            }
          }}
          onConfirm={(paymentMethodId, amountTenderedCents) =>
            void charge(paymentMethodId, amountTenderedCents)
          }
        />
      ) : null}
      <SaleSuccessModal sale={success} onClose={() => setSuccess(null)} />
    </div>
  );
}
