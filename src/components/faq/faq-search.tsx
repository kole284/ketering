"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FaqCategory } from "@/components/faq/faq-category";
import { Button } from "@/components/ui/button";
import type { FaqCategory as FaqCategoryType } from "@/content/faq";

type FaqSearchProps = {
  categories: FaqCategoryType[];
};

function normalize(value: string): string {
  return value.toLocaleLowerCase("sr-RS");
}

export function FaqSearch({ categories }: FaqSearchProps) {
  const [query, setQuery] = useState("");
  const trimmedQuery = query.trim();

  const filteredCategories = useMemo(() => {
    if (!trimmedQuery) {
      return categories;
    }

    const needle = normalize(trimmedQuery);

    return categories
      .map((category) => ({
        ...category,
        questions: category.questions.filter((item) =>
          normalize(`${item.question} ${item.answer}`).includes(needle),
        ),
      }))
      .filter((category) => category.questions.length > 0);
  }, [categories, trimmedQuery]);

  const hasResults = filteredCategories.length > 0;

  return (
    <div>
      <div className="faq-search">
        <label htmlFor="faq-search" className="sr-only">
          Pretraži česta pitanja
        </label>
        <Search aria-hidden="true" size={18} className="text-[color:var(--muted-foreground)]" />
        <input
          id="faq-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          type="search"
          placeholder="Pretražite pitanje ili odgovor"
        />
        {trimmedQuery ? (
          <Button type="button" variant="ghost" className="min-h-9 px-2" onClick={() => setQuery("")}>
            <X aria-hidden="true" size={16} />
            Obriši
          </Button>
        ) : null}
      </div>

      {hasResults ? (
        <div className="faq-category-grid mt-8">
          {filteredCategories.map((category) => (
            <FaqCategory key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <div className="surface-panel mt-8" role="status">
          <h2 className="text-xl font-semibold text-[color:var(--foreground)]">Nema rezultata za pretragu</h2>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted-foreground)]">
            Pokušajte sa kraćim pojmom, na primer “dostava”, “plaćanje” ili “email”.
          </p>
          <Button type="button" variant="outline" className="mt-5" onClick={() => setQuery("")}>
            Prikaži sva pitanja
          </Button>
        </div>
      )}
    </div>
  );
}
