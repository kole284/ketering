import { describe, expect, it } from "vitest";
import { addCartItem, buildCartItems, calculateSubtotalRsd, updateCartQuantity } from "@/lib/cart";
import type { Product } from "@/lib/types/restaurant";

describe("cart utilities", () => {
  const products: Product[] = [
    { id: 1, name: "Mini sendvič", image: "/a.svg", priceRsd: 300 },
    { id: 2, name: "Mini sendvič", image: "/b.svg", priceRsd: 450 },
  ];

  it("uses product id as identity even when names are duplicated", () => {
    let cart = addCartItem({}, 1);
    cart = addCartItem(cart, 2);
    cart = addCartItem(cart, 2);

    const items = buildCartItems(products, cart);

    expect(items).toHaveLength(2);
    expect(items).toEqual([
      expect.objectContaining({ id: 1, name: "Mini sendvič", quantity: 1, unitPrice: 300 }),
      expect.objectContaining({ id: 2, name: "Mini sendvič", quantity: 2, unitPrice: 450 }),
    ]);
    expect(calculateSubtotalRsd(items)).toBe(1200);
  });

  it("removes an item when quantity reaches zero", () => {
    const cart = updateCartQuantity({ 1: 1 }, 1, -1);
    expect(cart).toEqual({});
  });
});
