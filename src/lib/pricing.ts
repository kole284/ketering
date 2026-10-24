import type { Method } from "./booking";
import { SERVINGO_DRINKS, isDrink, type MenuItem } from "./menu";

/**
 * Bill rules shared by the cart (for display) and the server (for the amount actually charged).
 * Pure: no database, no browser.
 */

export type Fees = { deliveryFee: number; platformFee: number; deliveryMinimum: number };

/** Whose bill a line goes on: a restaurant, or Servingo for drinks ordered on their own. */
export type Seller = { id: string; name: string };

export const SERVINGO_SELLER: Seller = { id: SERVINGO_DRINKS, name: "Servingo" };

export type PricedLineInput = {
  item: Pick<MenuItem, "price" | "restaurantId">;
  quantity: number;
  /** The bill this line belongs to; drinks take the restaurant they were ordered with. */
  restaurantId: string;
  restaurantName: string;
};

export type PickupReason = "chosen" | "city" | "minimum";

/** Rounded per line, so a bill is the sum of what its lines show (0,5 kg × 3.333 din = 1.667 din). */
export const lineTotal = (price: number, quantity: number) => Math.round(price * quantity);

export function priceBills<L extends PricedLineInput>(
  input: L[],
  fees: Fees,
  { method, cityOk }: { method: Method; cityOk: boolean },
) {
  const lines = input.map((line) => ({ ...line, total: lineTotal(line.item.price, line.quantity) }));

  // One restaurant, one bill: fees and the delivery minimum apply per restaurant.
  // Bills follow the order restaurants were added in; Servingo's own drinks bill comes last.
  const sellers = new Map<string, Seller>();
  for (const line of lines) {
    if (line.restaurantId !== SERVINGO_DRINKS) sellers.set(line.restaurantId, { id: line.restaurantId, name: line.restaurantName });
  }
  sellers.set(SERVINGO_SELLER.id, SERVINGO_SELLER);

  const bills = [...sellers.values()].flatMap((seller) => {
    const own = lines.filter((line) => line.restaurantId === seller.id);
    if (own.length === 0) return [];
    const subtotal = own.reduce((sum, line) => sum + line.total, 0);
    const delivery = method === "dostava" && cityOk && subtotal >= fees.deliveryMinimum;
    const deliveryFee = delivery ? fees.deliveryFee : 0;
    const pickupReason: PickupReason | null = delivery
      ? null
      : method === "preuzimanje"
        ? "chosen"
        : !cityOk
          ? "city"
          : "minimum";
    return [
      {
        restaurant: seller,
        lines: own,
        subtotal,
        delivery,
        /** Why a bill is pickup: the customer chose it, the city is outside Belgrade, or it is under the minimum. */
        pickupReason,
        deliveryFee,
        platformFee: fees.platformFee,
        total: subtotal + deliveryFee + fees.platformFee,
        missingForDelivery: Math.max(0, fees.deliveryMinimum - subtotal),
        // Servingo buys the drinks, so it must also get the order email for any bill with drinks.
        notifyServingo: own.some((line) => isDrink(line.item)),
      },
    ];
  });

  return {
    lines,
    bills,
    subtotal: lines.reduce((sum, line) => sum + line.total, 0),
    total: bills.reduce((sum, bill) => sum + bill.total, 0),
    needsAddress: bills.some((bill) => bill.delivery),
    count: lines.length,
  };
}
