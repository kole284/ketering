import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.contact.title} | Servingo` };
}

export default async function ContactPage() {
  const { t } = await getDictionary();
  // Placeholder contact details until the real ones are confirmed.
  const contacts = [
    { label: t.contact.email, value: "podrska@servingo.rs", href: "mailto:podrska@servingo.rs" },
    { label: t.contact.phone, value: "+381 11 000 0000", href: "tel:+381110000000" },
    { label: t.contact.hours, value: t.contact.hoursValue },
  ];

  return (
    <PageShell title={t.contact.title} intro={t.contact.intro}>
      <dl className="grid max-w-3xl gap-px overflow-hidden border border-line bg-line md:grid-cols-3">
        {contacts.map((contact) => (
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
