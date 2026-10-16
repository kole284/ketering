import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.legal.title} | Servingo` };
}

// The two documents stay clearly separated with their own headings and anchors.
// Final text must be reviewed by a lawyer before launch.
export default async function LegalPage() {
  const { t } = await getDictionary();
  const documents = [
    { id: "privatnost", title: t.legal.privacy },
    { id: "uslovi", title: t.legal.terms },
  ];

  return (
    <PageShell title={t.legal.title}>
      <nav aria-label={t.legal.documents} className="flex flex-wrap gap-2">
        {documents.map((doc) => (
          <a
            key={doc.id}
            href={`#${doc.id}`}
            className="flex h-10 items-center rounded-full border border-line px-5 text-[15px] font-medium hover:border-ink"
          >
            {doc.title}
          </a>
        ))}
      </nav>

      {documents.map((doc) => (
        <section key={doc.id} id={doc.id} className="mt-14 max-w-[70ch] scroll-mt-28 border-t border-line pt-10">
          <h2 className="text-[28px] font-medium tracking-[-0.01em]">{doc.title}</h2>
          <p className="mt-4 text-lg leading-8 text-muted">{t.legal.pending}</p>
        </section>
      ))}
    </PageShell>
  );
}
