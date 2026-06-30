import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FaqAccordion } from "@/components/faq/faq-accordion";
import { FaqSearch } from "@/components/faq/faq-search";
import { FeaturedFaq } from "@/components/faq/featured-faq";
import {
  buildFaqJsonLd,
  faqCategories,
  getAllFaqItems,
  getDuplicateFaqIds,
  getFeaturedFaqItems,
} from "@/content/faq";

describe("FAQ content", () => {
  it("has no duplicate FAQ item IDs", () => {
    expect(getDuplicateFaqIds()).toEqual([]);
  });

  it("builds FAQPage structured data from visible questions", () => {
    const items = getAllFaqItems();
    const jsonLd = buildFaqJsonLd(items);

    expect(jsonLd["@type"]).toBe("FAQPage");
    expect(jsonLd.mainEntity).toHaveLength(items.length);
    expect(jsonLd.mainEntity[0]).toMatchObject({
      "@type": "Question",
      acceptedAnswer: {
        "@type": "Answer",
      },
    });
  });
});

describe("FeaturedFaq", () => {
  it("renders featured questions and links to the full FAQ page", () => {
    render(<FeaturedFaq />);

    for (const item of getFeaturedFaqItems()) {
      expect(screen.getByRole("button", { name: new RegExp(item.question, "i") })).toBeInTheDocument();
    }

    expect(screen.getByRole("link", { name: /pogledaj sva česta pitanja/i })).toHaveAttribute("href", "/faq");
  });
});

describe("FaqSearch", () => {
  it("renders all FAQ categories", () => {
    render(<FaqSearch categories={faqCategories} />);

    for (const category of faqCategories) {
      expect(screen.getByRole("heading", { name: category.title })).toBeInTheDocument();
    }
  });

  it("filters questions by question and answer text", async () => {
    const user = userEvent.setup();
    render(<FaqSearch categories={faqCategories} />);

    await user.type(screen.getByRole("searchbox", { name: /pretraži česta pitanja/i }), "Spam");

    expect(screen.getByRole("button", { name: /šta ako nisam dobio email potvrdu/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Dostava" })).not.toBeInTheDocument();
  });

  it("shows an empty state and can clear search", async () => {
    const user = userEvent.setup();
    render(<FaqSearch categories={faqCategories} />);

    await user.type(screen.getByRole("searchbox", { name: /pretraži česta pitanja/i }), "nemaovogpojma");

    expect(screen.getByText(/nema rezultata za pretragu/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /prikaži sva pitanja/i }));

    expect(screen.getByRole("heading", { name: "Poručivanje" })).toBeInTheDocument();
  });
});

describe("FaqAccordion", () => {
  const [firstItem, secondItem] = getAllFaqItems().slice(0, 2);

  it("opens and closes an accordion item", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={[firstItem]} />);

    const trigger = screen.getByRole("button", { name: firstItem.question });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(firstItem.answer)).toBeVisible();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("supports keyboard interaction", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion items={[firstItem, secondItem]} />);

    await user.tab();
    expect(screen.getByRole("button", { name: firstItem.question })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: firstItem.question })).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{ArrowDown}");
    const secondTrigger = screen.getByRole("button", { name: secondItem.question });
    expect(secondTrigger).toHaveFocus();

    await user.keyboard(" ");
    expect(secondTrigger).toHaveAttribute("aria-expanded", "true");
    expect(within(screen.getByText(secondItem.answer).closest(".faq-content") as HTMLElement).getByText(secondItem.answer)).toBeVisible();
  });
});
