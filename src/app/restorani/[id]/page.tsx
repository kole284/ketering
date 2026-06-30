import Image from "next/image";
import { notFound } from "next/navigation";
import { Clock, MapPin, ShoppingCart, Star, Truck } from "lucide-react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import RestaurantCartDemo from "@/components/restaurant-cart-demo";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { getRestaurantById } from "@/services/restaurant.service";

export const dynamic = "force-dynamic";

type RestaurantDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export default async function RestaurantDetailsPage({ params }: RestaurantDetailsPageProps) {
  const { id } = await params;
  const restaurantId = Number(id);

  if (Number.isNaN(restaurantId)) {
    notFound();
  }

  const restaurant = await getRestaurantById(restaurantId);

  if (!restaurant) {
    notFound();
  }

  return (
    <main className="site-shell min-h-screen overflow-x-clip">
      <div className="page-bg" />

      <section className="site-container overflow-x-hidden pb-16">
        <SiteHeader />

        <section className="surface-panel reveal-up delay-1 mt-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-lg)] md:aspect-[21/9]">
            <Image
              src={restaurant.cover}
              alt={restaurant.name}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="image-scrim" />
            <div className="absolute bottom-5 left-5 right-5 text-white sm:bottom-7 sm:left-7 sm:right-7">
              <p className="text-sm font-semibold text-white/85">{restaurant.city} · {restaurant.cuisine}</p>
              <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
                {restaurant.name}
              </h1>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="info-line">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[color:var(--muted-foreground)]">
                <Star aria-hidden="true" size={15} /> Ocena
              </p>
              <p className="mt-1 text-lg font-bold text-[color:var(--foreground)]">{restaurant.rating}</p>
            </div>
            <div className="info-line">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[color:var(--muted-foreground)]">
                <Clock aria-hidden="true" size={15} /> Vreme isporuke
              </p>
              <p className="mt-1 text-lg font-bold text-[color:var(--foreground)]">{restaurant.eta}</p>
            </div>
            <div className="info-line">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[color:var(--muted-foreground)]">
                <ShoppingCart aria-hidden="true" size={15} /> Minimalna porudžbina
              </p>
              <p className="mt-1 text-lg font-bold text-[color:var(--foreground)]">{restaurant.minOrder}</p>
            </div>
            <div className="info-line">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[color:var(--muted-foreground)]">
                <Truck aria-hidden="true" size={15} /> Dostava
              </p>
              <p className="mt-1 text-lg font-bold text-[color:var(--foreground)]">{restaurant.deliveryFee}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <article className="order-card reveal-up delay-2">
            <span className="eyebrow">Pregled</span>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">Detalji i ponude</h2>
            <p className="mt-3 text-[color:var(--muted-foreground)]">{restaurant.description}</p>
            <p className="mt-4 flex gap-2 rounded-[var(--radius-lg)] bg-[color:var(--surface)] p-4 text-sm text-[color:var(--muted-foreground)]">
              <MapPin aria-hidden="true" size={17} className="mt-0.5 shrink-0 text-[color:var(--primary)]" />
              {restaurant.address}
            </p>

            <h3 className="mt-6 text-sm font-bold uppercase text-[color:var(--muted-foreground)]">Aktuelne ponude</h3>
            <ul className="mt-3 space-y-2">
              {restaurant.offers.map((offer) => (
                <li key={offer} className="inline-flex">
                  <Badge tone="primary">{offer}</Badge>
                </li>
              ))}
            </ul>
          </article>

          <aside className="checkout-card reveal-up delay-3">
            <span className="eyebrow">Poručivanje</span>
            <h2 className="mt-3 text-2xl font-semibold">Sastavi korpu i potvrdi termin</h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
              Izaberi stavke iz menija, dodaj adresu i termin isporuke, pa pošalji porudžbinu.
            </p>
            <div className="mt-6 grid gap-3">
              <LinkButton href="#checkout">
                Pokreni porudžbinu
              </LinkButton>
              <LinkButton href="/restorani" variant="outline">
                Svi restorani
              </LinkButton>
            </div>
          </aside>
        </section>

        <RestaurantCartDemo restaurant={restaurant} />

        <div className="mt-8 flex justify-center">
          <LinkButton href="/" variant="ghost">
            Nazad na početnu
          </LinkButton>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
