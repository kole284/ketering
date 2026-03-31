"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type Product = {
  name: string;
  image: string;
  price: string;
};

type Restaurant = {
  id: number;
  name: string;
  city: string;
  cuisine: string;
  rating: string;
  eta: string;
  cover: string;
  products: Product[];
};

const cities = ["Beograd", "Novi Sad", "Nis", "Kragujevac"];

const restaurants: Restaurant[] = [
  {
    id: 1,
    name: "Bella Trpeza",
    city: "Beograd",
    cuisine: "Domaca kuhinja",
    rating: "4.9",
    eta: "45-60 min",
    cover:
      "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        name: "Mini sendvici mix (20 kom)",
        image:
          "https://images.unsplash.com/photo-1553909489-cd47e0907980?auto=format&fit=crop&w=900&q=80",
        price: "2.900 RSD",
      },
      {
        name: "Finger food box premium",
        image:
          "https://images.unsplash.com/photo-1564758866810-52f5f46be292?auto=format&fit=crop&w=900&q=80",
        price: "4.600 RSD",
      },
      {
        name: "Veggie platter",
        image:
          "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
        price: "3.200 RSD",
      },
    ],
  },
  {
    id: 2,
    name: "Urban Bites Catering",
    city: "Beograd",
    cuisine: "Fusion",
    rating: "4.7",
    eta: "35-50 min",
    cover:
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        name: "Wrap station (15 osoba)",
        image:
          "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=900&q=80",
        price: "8.500 RSD",
      },
      {
        name: "Burger slider set (24 kom)",
        image:
          "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=900&q=80",
        price: "5.900 RSD",
      },
      {
        name: "Mini deserti assorted",
        image:
          "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?auto=format&fit=crop&w=900&q=80",
        price: "3.900 RSD",
      },
    ],
  },
  {
    id: 3,
    name: "SalaS Party Food",
    city: "Novi Sad",
    cuisine: "Vojvodjanski specijaliteti",
    rating: "4.8",
    eta: "50-70 min",
    cover:
      "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        name: "Kanape selection (30 kom)",
        image:
          "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80",
        price: "4.200 RSD",
      },
      {
        name: "Rostilj box family",
        image:
          "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=900&q=80",
        price: "6.700 RSD",
      },
      {
        name: "Cheese & fruit board",
        image:
          "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=900&q=80",
        price: "5.100 RSD",
      },
    ],
  },
  {
    id: 4,
    name: "Juzni Sto",
    city: "Nis",
    cuisine: "Tradicionalna kuhinja",
    rating: "4.6",
    eta: "60-80 min",
    cover:
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
    products: [
      {
        name: "Topla predjela (10 osoba)",
        image:
          "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?auto=format&fit=crop&w=900&q=80",
        price: "7.400 RSD",
      },
      {
        name: "Posna ketering tabla",
        image:
          "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
        price: "4.300 RSD",
      },
      {
        name: "Peciva mix (40 kom)",
        image:
          "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80",
        price: "3.500 RSD",
      },
    ],
  },
];

export default function Home() {
  const [selectedCity, setSelectedCity] = useState<string>(cities[0]);

  const filteredRestaurants = useMemo(
    () => restaurants.filter((restaurant) => restaurant.city === selectedCity),
    [selectedCity],
  );

  return (
    <main className="min-h-screen text-slate-900">
      <div className="page-bg" />

      <section className="mx-auto w-full max-w-7xl px-3 pb-12 pt-4 sm:px-8 sm:pb-14 sm:pt-6 lg:px-10 lg:pt-8">
        <header className="glass-panel reveal-up flex flex-col items-start justify-between gap-3 rounded-[28px] px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-7">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="brand-logo">
              <Image
                src="/ketering-logo.png"
                alt="KeteringGo logo"
                width={340}
                height={170}
                className="h-auto w-auto max-h-14 object-contain sm:max-h-24"
                priority
              />
            </span>
            <div>
              <p className="font-brand text-lg font-bold leading-tight tracking-tight sm:text-xl">KeteringGo</p>
              <p className="max-w-[180px] text-xs text-slate-600 sm:max-w-none">Brzo porucivanje keteringa za svaki dogadjaj</p>
            </div>
          </div>
          <nav className="flex w-full flex-wrap items-center gap-1.5 text-sm font-semibold sm:w-auto sm:justify-end sm:gap-2">
            <button className="chip">Top ponude</button>
            <button className="chip">Korporativno</button>
            <button className="cta-secondary">Prijava</button>
          </nav>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="hero-card reveal-up delay-1">
            <h1 className="font-brand text-[2.15rem] font-bold leading-[1.03] tracking-tight sm:text-5xl sm:leading-tight">
              Poruci ketering za tim, rodjendan ili poslovni event
            </h1>
            <p className="mt-4 max-w-xl text-[1.02rem] leading-relaxed text-slate-700 sm:text-lg">
              Izaberi grad, pogledaj proverene restorane i zavrsi porudzbinu u par koraka.
              Ovaj demo prikazuje ceo izgled sajta bez backend implementacije.
            </p>
            <div className="mt-7 grid w-full gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
              <button className="cta-main w-full sm:w-auto">Poruci ketering</button>
              <button className="cta-ghost w-full sm:w-auto">Pogledaj restorane</button>
            </div>
          </article>

          <aside className="selection-card reveal-up delay-2">
            <h2 className="font-brand text-[1.75rem] font-semibold sm:text-2xl">Izaberi grad</h2>
            <p className="mt-1 text-sm text-slate-600">Prikazujemo ponudu restorana za izabranu lokaciju.</p>
            <label htmlFor="city" className="mt-6 block text-sm font-semibold text-slate-700">
              Grad
            </label>
            <select
              id="city"
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-medium shadow-sm outline-none transition focus:border-teal-500"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="tag">Dostava isti dan</span>
              <span className="tag">Veggie opcije</span>
              <span className="tag">Poslovni paketi</span>
            </div>
          </aside>
        </div>

        <section className="mt-10 sm:mt-12">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div>
              <h2 className="font-brand text-2xl font-bold sm:text-3xl">Restorani u gradu: {selectedCity}</h2>
              <p className="text-sm text-slate-600">
                Svaki profil sadrzi proizvode sa slikom i cenom, kao na aplikacijama za dostavu.
              </p>
            </div>
            <span className="self-start rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur sm:self-auto">
              {filteredRestaurants.length} restorana
            </span>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {filteredRestaurants.map((restaurant, index) => (
              <article
                key={restaurant.id}
                className="restaurant-card reveal-up"
                style={{ animationDelay: `${150 + index * 90}ms` }}
              >
                <div className="relative h-48 overflow-hidden sm:h-44">
                  <Image
                    src={restaurant.cover}
                    alt={restaurant.name}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
                    <div>
                      <h3 className="font-brand text-xl font-bold sm:text-2xl">{restaurant.name}</h3>
                      <p className="text-sm text-white/85">{restaurant.cuisine}</p>
                    </div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-semibold backdrop-blur">
                      {restaurant.rating}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-slate-600">Prosecno vreme isporuke</p>
                    <p className="font-semibold text-slate-900">{restaurant.eta}</p>
                  </div>

                  <div className="space-y-3">
                    {restaurant.products.map((product) => (
                      <div
                        key={product.name}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={56}
                            height={56}
                            className="h-14 w-14 rounded-xl object-cover"
                          />
                          <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-amber-200 px-3 py-1 text-sm font-bold text-amber-900">
                          {product.price}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button className="cta-main w-full">Poruci ketering</button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 sm:mt-14 lg:grid-cols-[1fr_0.9fr]">
          <article className="order-card reveal-up delay-3">
            <h2 className="font-brand text-2xl font-bold sm:text-3xl">Korak porudzbine</h2>
            <p className="mt-2 text-slate-600">
              Kada kliknes na <strong>Poruci ketering</strong>, korisnik prolazi kroz sledece podatke.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="field">
                Datum
                <input type="date" />
              </label>
              <label className="field">
                Vreme
                <input type="time" />
              </label>
              <label className="field sm:col-span-2">
                Mesto dogadjaja
                <input type="text" placeholder="npr. Bulevar kralja Aleksandra 73" />
              </label>
              <label className="field">
                Email adresa
                <input type="email" placeholder="ime@firma.rs" />
              </label>
              <label className="field">
                Broj telefona
                <input type="tel" placeholder="06x xxx xxxx" />
              </label>
            </div>

            <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-950">
              Placanje: online karticom ili digitalnim novcanikom (vizuelni prikaz, bez realne naplate).
            </div>
          </article>

          <aside className="checkout-card reveal-up delay-4">
            <h3 className="font-brand text-[1.75rem] font-bold sm:text-2xl">Sta sistem radi nakon porudzbine</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li className="info-line">Racun i potvrda stizu kupcu na email.</li>
              <li className="info-line">Kupac moze da ostavi email i telefon ili da napravi nalog.</li>
              <li className="info-line">Porudzbenica ide restoranu putem email i SMS obavestenja.</li>
              <li className="info-line">Kopija porudzbenice stize i administratoru radi pracenja.</li>
            </ul>
            <button className="cta-main mt-7 w-full">Nastavi na placanje</button>
            <p className="mt-3 text-center text-xs text-slate-500">Frontend demo: funkcionalnosti nisu povezane sa backend servisima.</p>
          </aside>
        </section>
      </section>
    </main>
  );
}
