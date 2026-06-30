import type { Metadata } from "next";
import { FaqSection } from "@/components/faq/faq-section";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { buildFaqJsonLd, faqCategories, getAllFaqItems } from "@/content/faq";

export const metadata: Metadata = {
  title: "Česta pitanja | KeteringGo",
  description:
    "Pronađite odgovore na najčešća pitanja o poručivanju keteringa, dostavi, plaćanju, izmenama i otkazivanju porudžbina.",
};

export default function FaqPage() {
  const allFaqItems = getAllFaqItems(faqCategories);
  const jsonLd = buildFaqJsonLd(allFaqItems);

  return (
    <main className="site-shell min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
      />
      <div className="page-bg" />
      <section className="site-container pb-16">
        <SiteHeader />
        <header className="surface-panel mt-8">
          <Badge tone="primary">Podrška za poručivanje</Badge>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-5xl">
            Česta pitanja
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[color:var(--muted-foreground)]">
            Odgovori na najčešće nedoumice o poručivanju keteringa, dostavi, plaćanju, izmenama, alergijama,
            poslovnim porudžbinama i tehničkim problemima.
          </p>
        </header>
        <div className="mt-8">
          <FaqSection />
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
