import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RestaurantCartDemo from "@/components/restaurant-cart-demo";
import type { Restaurant } from "@/lib/types/restaurant";

const restaurant: Restaurant = {
  id: 7,
  slug: "savski-venac-mezze",
  name: "Savski Venac Mezze",
  city: "Beograd",
  cityId: 1,
  citySlug: "beograd",
  cuisine: "Mediteranska",
  rating: "4.9",
  eta: "30-40 min",
  cover: "/placeholders/cover.svg",
  description: "Mediteranski mezze.",
  address: "Sarajevska 27, Beograd",
  minOrderRsd: 1100,
  deliveryFeeRsd: 170,
  leadTimeMinutes: 60,
  timezone: "Europe/Belgrade",
  isActive: true,
  offers: ["Mezze paket za 8 osoba"],
  products: [
    { id: 501, name: "Humus trio", image: "/placeholders/food.svg", priceRsd: 480 },
    { id: 502, name: "Humus trio", image: "/placeholders/food.svg", priceRsd: 720 },
  ],
  workingHours: [
    { dayOfWeek: 0, opensAt: "12:00", closesAt: "18:00", isClosed: false },
    { dayOfWeek: 1, opensAt: "10:00", closesAt: "21:00", isClosed: false },
    { dayOfWeek: 2, opensAt: "10:00", closesAt: "21:00", isClosed: false },
    { dayOfWeek: 3, opensAt: "10:00", closesAt: "21:00", isClosed: false },
    { dayOfWeek: 4, opensAt: "10:00", closesAt: "21:00", isClosed: false },
    { dayOfWeek: 5, opensAt: "10:00", closesAt: "23:00", isClosed: false },
    { dayOfWeek: 6, opensAt: "10:00", closesAt: "23:00", isClosed: false },
  ],
};

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function fillValidCheckout(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getAllByLabelText("Povećaj količinu za Humus trio")[0]);
  await user.click(screen.getAllByLabelText("Povećaj količinu za Humus trio")[0]);
  await user.click(screen.getAllByLabelText("Povećaj količinu za Humus trio")[0]);

  await user.type(screen.getByLabelText("Ime i prezime"), "QA Test");
  await user.type(screen.getByLabelText("Email adresa"), "qa@example.com");
  await user.type(screen.getByLabelText("Broj telefona (Srbija)"), "+381641234567");
  await user.type(screen.getByLabelText("Adresa događaja"), "Bulevar QA 1, Beograd");

  await user.click(screen.getByRole("button", { name: "Datum" }));
  await user.click(screen.getByRole("button", { name: "Pet, 10. jul" }));
  await user.click(screen.getByRole("button", { name: "Potvrdi datum" }));

  await user.click(screen.getByRole("button", { name: /Vreme/ }));
  await user.click(screen.getByRole("button", { name: "12:00" }));
  await user.click(screen.getByRole("button", { name: "Odaberi" }));
}

describe("RestaurantCartDemo", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-07-10T06:00:00.000Z"));
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "idem-web-test-1"),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shows a user-facing validation error instead of submitting an empty cart", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<RestaurantCartDemo restaurant={restaurant} />);

    await user.click(screen.getByRole("button", { name: "Pošalji porudžbinu" }));

    expect(await screen.findByText(/korpa je prazna/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses /api/v1/orders and keeps the same idempotency key for retry", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce(jsonResponse({
        success: false,
        error: { message: "Baza trenutno nije dostupna. Pokušaj ponovo." },
      }, { status: 503 }))
      .mockResolvedValueOnce(jsonResponse({
        success: true,
        data: {
          id: 55,
          smsDelivery: "not_requested",
          emailMessage: "nije poslato",
        },
      }, { status: 201 }));

    render(<RestaurantCartDemo restaurant={restaurant} />);
    await fillValidCheckout(user);

    await user.click(screen.getByRole("button", { name: "Pošalji porudžbinu" }));

    expect(await screen.findByText("Baza trenutno nije dostupna. Pokušaj ponovo.")).toBeInTheDocument();
    expect(screen.getByLabelText("Ime i prezime")).toHaveValue("QA Test");

    await user.click(screen.getByRole("button", { name: "Pošalji porudžbinu" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/v1/orders", expect.objectContaining({
      headers: expect.objectContaining({ "Idempotency-Key": "idem-web-test-1" }),
    }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/v1/orders", expect.objectContaining({
      headers: expect.objectContaining({ "Idempotency-Key": "idem-web-test-1" }),
    }));
    expect(await screen.findByText(/narudžbina #55 je sačuvana/i)).toBeInTheDocument();
  });
});
