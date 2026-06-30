import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RestaurantCard } from "@/components/restaurant/restaurant-card";
import { LinkButton } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { listRestaurants } from "@/services/restaurant.service";

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

      <section className="site-container pb-16">
        <SiteHeader />

        <section className="surface-panel reveal-up delay-1 mt-8">
          <SectionHeader
            eyebrow="Katalog"
            title="Svi restorani"
            description="Pregled aktivnih restorana, ponuda, minimalne vrednosti porudžbine i menija."
            action={<LinkButton href="/" variant="outline">Nazad na početnu</LinkButton>}
          />
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {restaurants.map((restaurant, index) => (
            <div key={restaurant.id} className="reveal-up" style={{ animationDelay: `${120 + index * 80}ms` }}>
              <RestaurantCard restaurant={restaurant} priority={index < 2} />
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
