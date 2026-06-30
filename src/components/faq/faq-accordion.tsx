"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/content/faq";

type FaqAccordionProps = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  return (
    <Accordion.Root type="single" collapsible className="faq-accordion">
      {items.map((item) => (
        <Accordion.Item key={item.id} value={item.id} className="faq-item">
          <Accordion.Header asChild>
            <h3>
              <Accordion.Trigger className="faq-trigger">
                <span>{item.question}</span>
                <ChevronDown aria-hidden="true" size={18} className="faq-trigger-icon" />
              </Accordion.Trigger>
            </h3>
          </Accordion.Header>
          <Accordion.Content className="faq-content">
            <p>{item.answer}</p>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
