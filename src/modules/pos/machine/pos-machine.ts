export type PosStep =
  | "idle"
  | "selectCategory"
  | "selectProduct"
  | "selectOptions"
  | "inCart"
  | "payment"
  | "submitting"
  | "success"
  | "error";

export type CartLine = {
  variantId: string;
  label: string;
  unitPrice: number;
  quantity: number;
};

export type PosState = {
  step: PosStep;
  categoryId: string | null;
  productId: string | null;
  selectedOptionValueIds: string[];
  cart: CartLine[];
  paymentMethodId: string | null;
  lastSalePublicId: string | null;
  errorMessage: string | null;
};

export type PosEvent =
  | { type: "SELECT_CATEGORY"; categoryId: string | null }
  | { type: "SELECT_PRODUCT"; productId: string }
  | { type: "SELECT_OPTION"; optionValueId: string; groupId: string; replaceValueIds: string[] }
  | { type: "VARIANT_RESOLVED"; line: CartLine }
  | { type: "CHANGE_QTY"; variantId: string; quantity: number }
  | { type: "REMOVE_LINE"; variantId: string }
  | { type: "OPEN_PAYMENT" }
  | { type: "SELECT_PAYMENT"; paymentMethodId: string }
  | { type: "SUBMIT" }
  | { type: "SUCCESS"; publicId: string }
  | { type: "FAIL"; message: string }
  | { type: "RESET" }
  | { type: "BACK_TO_CART" };

export const initialPosState: PosState = {
  step: "idle",
  categoryId: null,
  productId: null,
  selectedOptionValueIds: [],
  cart: [],
  paymentMethodId: null,
  lastSalePublicId: null,
  errorMessage: null,
};

export function posReducer(state: PosState, event: PosEvent): PosState {
  switch (event.type) {
    case "SELECT_CATEGORY":
      return {
        ...state,
        step: event.categoryId ? "selectProduct" : "idle",
        categoryId: event.categoryId,
        productId: null,
        selectedOptionValueIds: [],
        errorMessage: null,
      };
    case "SELECT_PRODUCT":
      return {
        ...state,
        step: "selectOptions",
        productId: event.productId,
        selectedOptionValueIds: [],
        errorMessage: null,
      };
    case "SELECT_OPTION":
      return {
        ...state,
        selectedOptionValueIds: event.replaceValueIds,
      };
    case "VARIANT_RESOLVED": {
      const existing = state.cart.find((line) => line.variantId === event.line.variantId);
      const cart = existing
        ? state.cart.map((line) =>
            line.variantId === event.line.variantId
              ? { ...line, quantity: line.quantity + event.line.quantity }
              : line,
          )
        : [...state.cart, event.line];
      return {
        ...state,
        step: "inCart",
        cart,
        productId: null,
        selectedOptionValueIds: [],
      };
    }
    case "CHANGE_QTY":
      return {
        ...state,
        cart: state.cart
          .map((line) =>
            line.variantId === event.variantId
              ? { ...line, quantity: event.quantity }
              : line,
          )
          .filter((line) => line.quantity > 0),
      };
    case "REMOVE_LINE":
      return {
        ...state,
        cart: state.cart.filter((line) => line.variantId !== event.variantId),
      };
    case "OPEN_PAYMENT":
      return {
        ...state,
        step: state.cart.length ? "payment" : state.step,
        errorMessage: null,
      };
    case "SELECT_PAYMENT":
      return { ...state, paymentMethodId: event.paymentMethodId };
    case "SUBMIT":
      return { ...state, step: "submitting", errorMessage: null };
    case "SUCCESS":
      return {
        ...initialPosState,
        step: "success",
        lastSalePublicId: event.publicId,
      };
    case "FAIL":
      return { ...state, step: "error", errorMessage: event.message };
    case "BACK_TO_CART":
      return { ...state, step: "inCart", errorMessage: null };
    case "RESET":
      return { ...initialPosState, step: "idle" };
    default:
      return state;
  }
}

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}
