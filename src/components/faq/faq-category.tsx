import { FaqAccordion } from "@/components/faq/faq-accordion";
import type { FaqCategory as FaqCategoryType } from "@/content/faq";

type FaqCategoryProps = {
  category: FaqCategoryType;
};

export function FaqCategory({ category }: FaqCategoryProps) {
  return (
    <section className="faq-category" aria-labelledby={`faq-category-${category.id}`}>
      <h2 id={`faq-category-${category.id}`} className="text-2xl font-semibold text-[color:var(--foreground)]">
        {category.title}
      </h2>
      <div className="mt-4">
        <FaqAccordion items={category.questions} />
      </div>
    </section>
  );
}
