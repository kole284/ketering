"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LoadingScreen } from "./loading";
import type { CityAvailability, Restaurant } from "@/lib/types/restaurant";

let hasShownHomeSplashInRuntime = false;

const fallbackCities: CityAvailability[] = [
  { name: "Beograd", isAvailable: true },
  { name: "Novi Sad", isAvailable: false },
  { name: "Niš", isAvailable: false },
  { name: "Kragujevac", isAvailable: false },
];

const metrics = [
  { value: "7", label: "aktivnih restorana" },
  { value: "24h", label: "unapred planiranje" },
  { value: "Email", label: "potvrda porudžbine" },
];

export default function Home() {
  const [cities, setCities] = useState<CityAvailability[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>(fallbackCities[0].name);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(true);
  const [shouldShowEntrySplash] = useState(() => !hasShownHomeSplashInRuntime);
  const [hasMinimumSplashDurationElapsed, setHasMinimumSplashDurationElapsed] = useState(
    () => hasShownHomeSplashInRuntime,
  );
  const [isLoadingRestaurants, setIsLoadingRestaurants] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const cityOptions = cities.length > 0 ? cities : fallbackCities;

  const selectedCityEntry = useMemo(
    () => cityOptions.find((city) => city.name === selectedCity),
    [cityOptions, selectedCity],
  );

  const isCityAvailable = selectedCityEntry?.isAvailable ?? false;

  useEffect(() => {
    if (!shouldShowEntrySplash) {
      return;
    }

    hasShownHomeSplashInRuntime = true;

    const timeoutId = window.setTimeout(() => {
      setHasMinimumSplashDurationElapsed(true);
    }, 1100);

    return () => window.clearTimeout(timeoutId);
  }, [shouldShowEntrySplash]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCities() {
      try {
        setLoadError(null);
        setIsLoadingCities(true);

        const response = await fetch("/api/cities", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Neuspešno učitavanje gradova.");
        }

        const data = (await response.json()) as CityAvailability[];
        const nextCities = data.length > 0 ? data : fallbackCities;

        setCities(nextCities);
        setSelectedCity((prev) => {
          if (prev && nextCities.some((city) => city.name === prev)) {
            return prev;
          }

          const preferred = nextCities.find((city) => city.name === "Beograd");
          return preferred?.name ?? nextCities[0].name;
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(error);
        setLoadError("Trenutno ne možemo da učitamo gradove. Pokušaj osvežavanje stranice.");
        setCities(fallbackCities);
        setSelectedCity("Beograd");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingCities(false);
        }
      }
    }

    void loadCities();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedCity || !isCityAvailable) {
      setRestaurants([]);
      return;
    }

    const controller = new AbortController();

    async function loadRestaurantsByCity() {
      try {
        setLoadError(null);
        setIsLoadingRestaurants(true);

        const response = await fetch(`/api/restaurants?city=${encodeURIComponent(selectedCity)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Neuspešno učitavanje restorana.");
        }

        const data = (await response.json()) as Restaurant[];
        setRestaurants(data);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error(error);
        setLoadError("Trenutno ne možemo da učitamo restorane. Pokušaj ponovo malo kasnije.");
        setRestaurants([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingRestaurants(false);
        }
      }
    }

    void loadRestaurantsByCity();

    return () => controller.abort();
  }, [isCityAvailable, selectedCity]);

  const popularRestaurants = useMemo(() => {
    if (!isCityAvailable) {
      return [];
    }

    return [...restaurants]
      .sort((first, second) => Number.parseFloat(second.rating) - Number.parseFloat(first.rating))
      .slice(0, 3);
  }, [isCityAvailable, restaurants]);

  if (shouldShowEntrySplash && (isLoadingCities || !hasMinimumSplashDurationElapsed)) {
    return <LoadingScreen />;
  }

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
              priority
              className="brand-mark"
            />
            <span className="brand-copy">
              <span className="brand-name">KeteringGo</span>
              <span className="brand-line">Ketering za firme i događaje</span>
            </span>
          </Link>

          <nav className="site-nav-links" aria-label="Glavna navigacija">
            <Link href="/restorani">Restorani</Link>
            <a href="#ponuda">Ponuda</a>
          </nav>
        </header>

        <section className="hero-grid mt-8">
          <article className="hero-card reveal-up delay-1">
            <span className="eyebrow">Centralizovano poručivanje keteringa</span>
            <h1 className="mt-5 font-brand text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
              Ketering za timove, sastanke i privatne događaje.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Izaberi grad, uporedi proverene restorane, složi korpu i pošalji porudžbinu. Kupac dobija email potvrdu
              sa svim detaljima narudžbine.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#ponuda" className="cta-main inline-flex items-center justify-center">
                Pronađi restoran
              </a>
              <Link href="/restorani" className="cta-secondary inline-flex items-center justify-center">
                Svi restorani
              </Link>
            </div>

            <div className="metric-grid mt-10">
              {metrics.map((metric) => (
                <div key={metric.label} className="metric-card">
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="selection-card reveal-up delay-2">
            <div className="panel-heading">
              <span className="eyebrow">Lokacija</span>
              <h2 className="font-brand text-2xl font-semibold">Proveri dostupnost</h2>
            </div>

            <label htmlFor="city" className="field mt-6">
              Grad isporuke
              <select
                id="city"
                value={selectedCity}
                onChange={(event) => setSelectedCity(event.target.value)}
                className="control-input"
              >
                {cityOptions.map((city) => (
                  <option key={city.name} value={city.name}>
                    {city.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="status-panel mt-5" data-available={isCityAvailable ? "true" : "false"}>
              <span className="status-dot" />
              <div>
                <strong>{isCityAvailable ? "Dostupno za poručivanje" : "Još nije dostupno"}</strong>
                <p>
                  {isCityAvailable
                    ? `Prikazujemo aktivne restorane za ${selectedCity}.`
                    : "Trenutno radimo na proširenju pokrivenosti."}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <div className="info-line">
                <p className="text-xs uppercase tracking-wide text-slate-500">Za firme</p>
                <p className="mt-1 text-sm text-slate-700">Praktični obroci za sastanke, radionice i timske događaje.</p>
              </div>
              <div className="info-line">
                <p className="text-xs uppercase tracking-wide text-slate-500">Za proslave</p>
                <p className="mt-1 text-sm text-slate-700">Ponude za rođendane, porodična okupljanja i manje svečanosti.</p>
              </div>
            </div>
          </aside>
        </section>

        <section id="ponuda" className="mt-12 sm:mt-16">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Aktuelna ponuda</span>
              <h2 className="font-brand text-3xl font-semibold tracking-tight sm:text-4xl">
                Najbolje ocenjeni restorani u gradu: {selectedCity}
              </h2>
            </div>
            {isCityAvailable ? (
              <Link href="/restorani" className="cta-ghost inline-flex items-center justify-center">
                Cela ponuda
              </Link>
            ) : null}
          </div>

          {loadError ? (
            <p className="mt-5 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-900">{loadError}</p>
          ) : null}

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {isLoadingCities || (isCityAvailable && isLoadingRestaurants) ? (
              <article className="surface-panel rounded-3xl p-6 lg:col-span-3">
                <p className="text-sm font-semibold text-slate-700">Učitavanje ponude restorana...</p>
              </article>
            ) : isCityAvailable && popularRestaurants.length > 0 ? (
              popularRestaurants.map((restaurant, index) => (
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
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover"
                    />
                    <div className="image-scrim" />
                    <span className="rating-pill">{restaurant.rating}</span>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
                        {restaurant.cuisine}
                      </p>
                      <h3 className="mt-1 font-brand text-xl font-semibold">{restaurant.name}</h3>
                    </div>
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">{restaurant.description}</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="tag">{restaurant.eta}</span>
                      <span className="tag">Dostava {restaurant.deliveryFee}</span>
                    </div>
                    <Link
                      href={`/restorani/${restaurant.id}`}
                      className="cta-main inline-flex w-full items-center justify-center"
                    >
                      Pogledaj meni
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <article className="surface-panel rounded-3xl p-7 lg:col-span-3">
                <h3 className="font-brand text-2xl font-semibold">Usluga trenutno nije dostupna u ovom gradu.</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  KeteringGo trenutno radi sa restoranima u dostupnim gradovima. Izaberi Beograd za kompletan demo tok
                  poručivanja.
                </p>
              </article>
            )}
          </div>
        </section>

        <section className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            ["Izaberi ponudu", "Pregledaj restorane po gradu, kuhinji, vremenu isporuke i minimalnoj porudžbini."],
            ["Sastavi korpu", "Dodaj jela, uskladi količine i izaberi termin koji odgovara događaju."],
            ["Dobij potvrdu", "Nakon slanja porudžbine dobijaš pregled narudžbine i osnovne detalje isporuke."],
          ].map(([title, text]) => (
            <article key={title} className="surface-panel reveal-up rounded-3xl p-6">
              <h3 className="font-brand text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
