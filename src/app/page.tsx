"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Search,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { LoadingScreen } from "./loading";
import { FeaturedFaq } from "@/components/faq/featured-faq";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import type { CityAvailability, Restaurant } from "@/lib/types/restaurant";

let hasShownHomeSplashInRuntime = false;

const fallbackCities: CityAvailability[] = [
  { name: "Beograd", isAvailable: true },
  { name: "Novi Sad", isAvailable: false },
  { name: "Niš", isAvailable: false },
  { name: "Kragujevac", isAvailable: false },
];

const serviceHighlights = [
  { title: "Restorani i ketering ponude", text: "Pregled aktivnih restorana po gradu, kuhinji i uslovima isporuke." },
  { title: "Porudžbina sa terminom", text: "Korpa, kontakt podaci, adresa i termin isporuke na jednom mestu." },
  { title: "Server obračun cena", text: "Ukupan iznos se proverava na serveru pre čuvanja narudžbine." },
];

const cateringCategories = ["Poslovni ručkovi", "Sastanci", "Radionice", "Privatni događaji", "Timska okupljanja"];

const processSteps: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: ClipboardList,
    title: "Izaberi ponudu",
    text: "Pregledaj restorane po gradu, kuhinji, vremenu isporuke i minimalnoj porudžbini.",
  },
  {
    icon: CalendarCheck,
    title: "Sastavi korpu",
    text: "Dodaj jela, uskladi količine i izaberi termin koji odgovara događaju.",
  },
  {
    icon: CheckCircle2,
    title: "Dobij potvrdu",
    text: "Nakon slanja porudžbine dobijaš pregled narudžbine i osnovne detalje isporuke.",
  },
];

const benefitCards: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Truck,
    title: "Jasni uslovi isporuke",
    text: "Prikaz minimalne porudžbine, dostave i procenjenog vremena isporuke.",
  },
  {
    icon: ShieldCheck,
    title: "Pouzdan obračun",
    text: "Frontend ne šalje ukupan iznos kao izvor istine; server računa cene.",
  },
  {
    icon: Search,
    title: "Brži izbor",
    text: "Korisnik može brzo da uporedi dostupne restorane pre ulaska u meni.",
  },
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

      <section className="site-container pb-16">
        <SiteHeader />

        <section className="hero-grid pt-8">
          <article className="hero-card reveal-up delay-1">
            <Badge tone="primary" className="w-fit">
              <ShieldCheck aria-hidden="true" size={14} />
              Organizovano poručivanje keteringa
            </Badge>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Ketering za firme, događaje i privatne proslave u dostupnim gradovima.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--muted-foreground)] sm:text-lg">
              Izaberi grad, uporedi restorane, sastavi korpu i pošalji porudžbinu za kancelariju, sastanak ili događaj.
              Finalna cena se proverava na serveru pre potvrde.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="#ponuda">
                <Search aria-hidden="true" size={18} />
                Pronađi restoran
              </LinkButton>
              <LinkButton href="/restorani" variant="outline">
                Svi restorani
              </LinkButton>
            </div>

            <div className="metric-grid mt-10">
              {serviceHighlights.map((item) => (
                <div key={item.title} className="metric-card">
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </article>

          <aside className="selection-card reveal-up delay-2">
            <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--border)]">
              <Image
                src={popularRestaurants[0]?.cover ?? "/placeholders/cover.svg"}
                alt={popularRestaurants[0] ? `Ketering ponuda restorana ${popularRestaurants[0].name}` : "Ketering ponuda hrane"}
                fill
                priority
                sizes="(max-width: 960px) 100vw, 380px"
                className="object-cover"
              />
            </div>
            <span className="eyebrow">Lokacija</span>
            <h2 className="mt-2 text-2xl font-semibold">Proveri dostupnost isporuke</h2>

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
          <SectionHeader
            eyebrow="Aktuelna ponuda"
            title={`Restorani u gradu: ${selectedCity}`}
            description="Pregled dostupnih restorana sa osnovnim uslovima isporuke i linkom ka meniju."
            action={isCityAvailable ? <LinkButton href="/restorani" variant="ghost">Cela ponuda</LinkButton> : null}
          />

          {loadError ? (
            <p className="mt-5 rounded-[var(--radius-lg)] bg-[color:var(--destructive-surface)] px-4 py-3 text-sm font-medium text-[color:var(--destructive)]">
              {loadError}
            </p>
          ) : null}

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {isLoadingCities || (isCityAvailable && isLoadingRestaurants) ? (
              <article className="surface-panel lg:col-span-3">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">Učitavanje ponude restorana...</p>
                <div className="loading-line mt-4" aria-hidden="true" />
              </article>
            ) : isCityAvailable && popularRestaurants.length > 0 ? (
              popularRestaurants.map((restaurant, index) => (
                <div key={restaurant.id} className="reveal-up" style={{ animationDelay: `${120 + index * 80}ms` }}>
                  <RestaurantCard restaurant={restaurant} priority={index === 0} />
                </div>
              ))
            ) : (
              <article className="surface-panel lg:col-span-3">
                <h3 className="text-2xl font-semibold">Usluga trenutno nije dostupna u ovom gradu.</h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[color:var(--muted-foreground)]">
                  KeteringGo trenutno radi sa restoranima u dostupnim gradovima. Izaberi Beograd za kompletan demo tok
                  poručivanja.
                </p>
              </article>
            )}
          </div>
        </section>

        <section id="kako-funkcionise" className="mt-16">
          <SectionHeader
            eyebrow="Kako funkcioniše"
            title="Jednostavan tok od izbora restorana do potvrde porudžbine"
          />
          <div className="mt-6 grid gap-5 md:grid-cols-3">
          {processSteps.map(({ icon: Icon, title, text }) => (
            <article key={title} className="surface-panel reveal-up">
              <Icon aria-hidden="true" className="text-[color:var(--primary)]" size={24} />
              <h3 className="mt-4 text-xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">{text}</p>
            </article>
          ))}
          </div>
        </section>

        <section className="mt-16">
          <SectionHeader
            eyebrow="Vrste keteringa"
            title="Ponude za poslovne i privatne prilike"
            description="Kategorije pomažu korisniku da brže proceni da li restoran odgovara formatu događaja."
          />
          <div className="mt-6 flex flex-wrap gap-2">
            {cateringCategories.map((category) => (
              <Badge key={category} tone="primary">{category}</Badge>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-5 md:grid-cols-3">
          {benefitCards.map(({ icon: Icon, title, text }) => (
            <article key={title} className="surface-panel">
              <Icon aria-hidden="true" className="text-[color:var(--primary)]" size={24} />
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">{text}</p>
            </article>
          ))}
        </section>

        <FeaturedFaq />
      </section>
      <SiteFooter />
    </main>
  );
}
