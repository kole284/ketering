import type { Product } from "@/lib/types/restaurant";

export type CartState = Record<number, number>;

export type CartItem = Product & {
  quantity: number;
  unitPrice: number;
};

export function addCartItem(cart: CartState, productId: number): CartState {
  return {
    ...cart,
    [productId]: (cart[productId] ?? 0) + 1,
  };
}

export function updateCartQuantity(cart: CartState, productId: number, delta: number): CartState {
  const current = cart[productId] ?? 0;
  const next = Math.max(0, current + delta);

  if (next === 0) {
    const nextCart = { ...cart };
    delete nextCart[productId];
    return nextCart;
  }

  return {
    ...cart,
    [productId]: next,
  };
}

export function buildCartItems(products: Product[], cart: CartState): CartItem[] {
  return products
    .filter((product) => (cart[product.id] ?? 0) > 0)
    .map((product) => ({
      ...product,
      quantity: cart[product.id],
      unitPrice: product.priceRsd,
    }));
}

export function calculateSubtotalRsd(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
}
