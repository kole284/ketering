import { FaqAccordion } from "@/components/faq/faq-accordion";
import { LinkButton } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { getFeaturedFaqItems } from "@/content/faq";

export function FeaturedFaq() {
  const featuredItems = getFeaturedFaqItems();

  return (
    <section id="faq" className="mt-16">
      <SectionHeader
        eyebrow="FAQ"
        title="Česta pitanja"
        description="Najvažnije informacije o poručivanju, dostavi, plaćanju i izmenama pre slanja porudžbine."
        action={<LinkButton href="/faq" variant="outline">Pogledaj sva česta pitanja</LinkButton>}
      />
      <div className="mt-6">
        <FaqAccordion items={featuredItems} />
      </div>
    </section>
  );
}
