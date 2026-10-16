import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Kontakt | Servingo" };

// Placeholder contact details until the real ones are confirmed.
const CONTACTS = [
  { label: "Email", value: "podrska@servingo.rs", href: "mailto:podrska@servingo.rs" },
  { label: "Telefon", value: "+381 11 000 0000", href: "tel:+381110000000" },
  { label: "Radno vreme podrške", value: "Svakog dana od 8 do 20 h" },
];

export default function ContactPage() {
  return (
    <PageShell title="Kontakt" intro="Pitanja o porudžbini, dostavi ili saradnji? Javi nam se.">
      <dl className="grid max-w-3xl gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
        {CONTACTS.map((contact) => (
          <div key={contact.label} className="flex flex-col gap-1 bg-bg p-6">
            <dt className="text-[13px] text-muted">{contact.label}</dt>
            <dd className="text-lg font-medium">
              {contact.href ? (
                <a href={contact.href} className="hover:text-accent">
                  {contact.value}
                </a>
              ) : (
                contact.value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </PageShell>
  );
}
