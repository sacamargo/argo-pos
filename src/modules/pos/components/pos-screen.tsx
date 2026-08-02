"use client";

import { useMemo, useReducer, useState, useTransition } from "react";
import { Button } from "@/design-system/components/button";
import { Modal } from "@/design-system/components/modal";
import { PaymentModal } from "@/modules/pos/components/payment-modal";
import { PosCart } from "@/modules/pos/components/pos-cart";
import { PosCatalog } from "@/modules/pos/components/pos-catalog";
import {
  cartTotal,
  initialPosState,
  posReducer,
} from "@/modules/pos/machine/pos-machine";
import { createSale } from "@/modules/pos/services/sales-service";
import type {
  PosCategory,
  PosPaymentMethod,
  PosProduct,
  PosVariant,
} from "@/modules/pos/services/catalog-service";

type PosScreenProps = {
  categories: PosCategory[];
  products: PosProduct[];
  variants: PosVariant[];
  paymentMethods: PosPaymentMethod[];
};

export function PosScreen({
  categories,
  products,
  variants,
  paymentMethods,
}: PosScreenProps) {
  const [state, dispatch] = useReducer(posReducer, {
    ...initialPosState,
    categoryId: null,
  });
  const [search, setSearch] = useState("");
  const [amountTendered, setAmountTendered] = useState("");
  const [pending, startTransition] = useTransition();

  const categoryByProduct = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of products) {
      map.set(product.id, product.categoryId);
    }
    return map;
  }, [products]);

  const visibleVariants = useMemo(() => {
    const query = search.trim().toLowerCase();
    return variants.filter((variant) => {
      const categoryId = categoryByProduct.get(variant.productId);
      const matchesCategory =
        !state.categoryId || categoryId === state.categoryId;
      const matchesSearch =
        !query || variant.label.toLowerCase().includes(query);
      return matchesCategory && matchesSearch && variant.price > 0;
    });
  }, [variants, categoryByProduct, state.categoryId, search]);

  const total = cartTotal(state.cart);
  const itemCount = state.cart.reduce((sum, line) => sum + line.quantity, 0);
  const selectedMethod = paymentMethods.find(
    (method) => method.id === state.paymentMethodId,
  );
  const isCash = selectedMethod?.code === "cash";

  function confirmPayment() {
    if (!state.paymentMethodId || state.cart.length === 0) return;
    if (isCash) {
      const tendered = Number(amountTendered) || 0;
      if (tendered < total) return;
    }

    dispatch({ type: "SUBMIT" });
    startTransition(async () => {
      try {
        const tendered = Number(amountTendered) || 0;
        const result = await createSale({
          paymentMethodId: state.paymentMethodId!,
          items: state.cart.map((line) => ({
            variantId: line.variantId,
            quantity: line.quantity,
          })),
          amountTendered: isCash ? tendered : undefined,
          changeAmount: isCash ? tendered - total : undefined,
        });
        setAmountTendered("");
        dispatch({ type: "SUCCESS", publicId: result.publicId });
      } catch (error) {
        dispatch({
          type: "FAIL",
          message:
            error instanceof Error
              ? error.message
              : "No se pudo registrar la venta",
        });
      }
    });
  }

  return (
    <div className="flex h-full">
      <PosCart
        cart={state.cart}
        total={total}
        itemCount={itemCount}
        onChangeQty={(variantId, quantity) =>
          dispatch({ type: "CHANGE_QTY", variantId, quantity })
        }
        onRemove={(variantId) => dispatch({ type: "REMOVE_LINE", variantId })}
        onClear={() => {
          setAmountTendered("");
          dispatch({ type: "RESET" });
        }}
        onPay={() => dispatch({ type: "OPEN_PAYMENT" })}
      />

      <PosCatalog
        categories={categories}
        variants={visibleVariants}
        categoryId={state.categoryId}
        search={search}
        onSearchChange={setSearch}
        onSelectCategory={(categoryId) => {
          dispatch({ type: "SELECT_CATEGORY", categoryId });
        }}
        onAddVariant={(variant) =>
          dispatch({
            type: "VARIANT_RESOLVED",
            line: {
              variantId: variant.id,
              label: variant.label,
              unitPrice: variant.price,
              quantity: 1,
            },
          })
        }
      />

      <PaymentModal
        open={state.step === "payment" || state.step === "submitting"}
        pending={pending}
        total={total}
        paymentMethods={paymentMethods}
        paymentMethodId={state.paymentMethodId}
        amountTendered={amountTendered}
        onClose={() => dispatch({ type: "BACK_TO_CART" })}
        onSelectPayment={(paymentMethodId) => {
          setAmountTendered("");
          dispatch({ type: "SELECT_PAYMENT", paymentMethodId });
        }}
        onAmountChange={setAmountTendered}
        onConfirm={confirmPayment}
      />

      <Modal
        open={state.step === "success"}
        title="Venta registrada"
        onClose={() => dispatch({ type: "RESET" })}
        footer={
          <Button
            size="lg"
            className="w-full bg-[var(--color-accent)] hover:opacity-90"
            onClick={() => dispatch({ type: "RESET" })}
          >
            Nueva venta
          </Button>
        }
      >
        <p>
          Ticket <strong>{state.lastSalePublicId}</strong> guardado
          correctamente.
        </p>
      </Modal>

      <Modal
        open={state.step === "error"}
        title="No se pudo cobrar"
        onClose={() => dispatch({ type: "BACK_TO_CART" })}
        footer={
          <Button
            size="lg"
            className="w-full"
            onClick={() => dispatch({ type: "BACK_TO_CART" })}
          >
            Volver al carrito
          </Button>
        }
      >
        <p className="text-[var(--color-danger)]">{state.errorMessage}</p>
      </Modal>
    </div>
  );
}
