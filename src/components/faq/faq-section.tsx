import { FaqSearch } from "@/components/faq/faq-search";
import { faqCategories } from "@/content/faq";

export function FaqSection() {
  return <FaqSearch categories={faqCategories} />;
}
