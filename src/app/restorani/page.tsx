import Image from "next/image";
import Link from "next/link";
import { listRestaurants } from "@/lib/server/restaurant-repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Svi restorani | KeteringGo",
  description: "Detaljni prikaz restorana i ketering ponuda.",
};

export default async function RestaurantsPage() {
  const restaurants = await listRestaurants();

  return (
    <main className="site-shell min-h-screen">
      <div className="page-bg" />

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 pt-5 sm:px-8 lg:px-10">
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
              <span className="brand-line">Katalog restorana</span>
            </span>
          </Link>
          <nav className="site-nav-links" aria-label="Glavna navigacija">
            <Link href="/">Početna</Link>
            <Link href="/restorani">Restorani</Link>
          </nav>
        </header>

        <section className="surface-panel reveal-up delay-1 mt-8 rounded-3xl p-6 sm:p-8">
          <span className="eyebrow">Katalog</span>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-brand text-4xl font-semibold tracking-tight sm:text-5xl">Svi restorani</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Pregledaj aktivne restorane, njihove ponude, minimalan iznos porudžbine i celokupan meni.
              </p>
            </div>
            <Link href="/" className="cta-secondary inline-flex items-center justify-center">
              Nazad na početnu
            </Link>
          </div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {restaurants.map((restaurant, index) => (
            <article
              key={restaurant.id}
              className="restaurant-card reveal-up"
              style={{ animationDelay: `${120 + index * 80}ms` }}
            >
              <div className="relative h-44 overflow-hidden">
                <Image
                  src={restaurant.cover}
                  alt={restaurant.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  className="object-cover"
                />
                <div className="image-scrim" />
                <span className="rating-pill">{restaurant.rating}</span>
              </div>

              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                    {restaurant.cuisine} · {restaurant.city}
                  </p>
                  <h2 className="mt-1 font-brand text-xl font-semibold">{restaurant.name}</h2>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{restaurant.description}</p>
                <div className="flex flex-wrap gap-2">
                  {restaurant.offers.slice(0, 2).map((offer) => (
                    <span key={offer} className="tag">{offer}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Isporuka</span>
                  <span className="font-semibold">{restaurant.eta}</span>
                </div>
                <Link
                  href={`/restorani/${restaurant.id}`}
                  className="cta-main inline-flex w-full items-center justify-center"
                >
                  Pogledaj detalje restorana
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
