import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import RestaurantCartDemo from "@/components/restaurant-cart-demo";
import { getRestaurantById } from "@/lib/server/restaurant-repository";

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

      <section className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 pb-16 pt-5 sm:px-8 lg:px-10">
        <header className="site-nav reveal-up">
          <Link href="/" className="brand-lockup" aria-label="KeteringGo početna">
            <Image
              src="/ketering-logo-20260418.png"
              alt=""
              width={180}
              height={90}
              unoptimized
              className="brand-mark"
            />
            <span className="brand-copy">
              <span className="brand-name">KeteringGo</span>
              <span className="brand-line">Detalji restorana</span>
            </span>
          </Link>
          <nav className="site-nav-links" aria-label="Glavna navigacija">
            <Link href="/">Početna</Link>
            <Link href="/restorani">Restorani</Link>
          </nav>
        </header>

        <section className="surface-panel reveal-up delay-1 mt-8 rounded-3xl p-4 sm:p-6">
          <div className="relative h-64 overflow-hidden rounded-2xl sm:h-80">
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
              <p className="text-sm font-semibold text-white/80">{restaurant.city} · {restaurant.cuisine}</p>
              <h1 className="mt-2 max-w-3xl font-brand text-3xl font-semibold tracking-tight sm:text-5xl">
                {restaurant.name}
              </h1>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="info-line">
              <p className="text-xs uppercase tracking-wide text-slate-500">Ocena</p>
              <p className="mt-1 text-lg font-bold">{restaurant.rating}</p>
            </div>
            <div className="info-line">
              <p className="text-xs uppercase tracking-wide text-slate-500">Vreme isporuke</p>
              <p className="mt-1 text-lg font-bold">{restaurant.eta}</p>
            </div>
            <div className="info-line">
              <p className="text-xs uppercase tracking-wide text-slate-500">Minimalna porudžbina</p>
              <p className="mt-1 text-lg font-bold">{restaurant.minOrder}</p>
            </div>
            <div className="info-line">
              <p className="text-xs uppercase tracking-wide text-slate-500">Dostava</p>
              <p className="mt-1 text-lg font-bold">{restaurant.deliveryFee}</p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.75fr]">
          <article className="order-card reveal-up delay-2">
            <span className="eyebrow">Pregled</span>
            <h2 className="mt-3 font-brand text-2xl font-semibold sm:text-3xl">Detalji i ponude</h2>
            <p className="mt-3 text-slate-700">{restaurant.description}</p>
            <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">{restaurant.address}</p>

            <h3 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-600">Aktuelne ponude</h3>
            <ul className="mt-3 space-y-2">
              {restaurant.offers.map((offer) => (
                <li key={offer} className="tag inline-flex">{offer}</li>
              ))}
            </ul>
          </article>

          <aside className="checkout-card reveal-up delay-3">
            <span className="eyebrow">Poručivanje</span>
            <h2 className="mt-3 font-brand text-2xl font-semibold">Sastavi korpu i potvrdi termin.</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Izaberi stavke iz menija, dodaj adresu i termin isporuke, pa pošalji porudžbinu.
            </p>
            <div className="mt-6 grid gap-3">
              <Link href="#checkout" className="cta-main inline-flex items-center justify-center">
                Pokreni porudžbinu
              </Link>
              <Link href="/restorani" className="cta-secondary inline-flex items-center justify-center">
                Svi restorani
              </Link>
            </div>
          </aside>
        </section>

        <RestaurantCartDemo restaurant={restaurant} />

        <div className="mt-8 flex justify-center">
          <Link href="/" className="cta-ghost inline-flex items-center justify-center">
            Nazad na početnu
          </Link>
        </div>
      </section>
    </main>
  );
}
