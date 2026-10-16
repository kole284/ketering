import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";

export const metadata: Metadata = { title: "Politika privatnosti i uslovi korišćenja | Servingo" };

// The two documents stay clearly separated with their own headings and anchors.
// Final text must be reviewed by a lawyer before launch.
const DOCUMENTS = [
  { id: "privatnost", title: "Politika privatnosti" },
  { id: "uslovi", title: "Uslovi korišćenja" },
];

export default function LegalPage() {
  return (
    <PageShell title="Politika privatnosti i uslovi korišćenja">
      <nav aria-label="Dokumenti" className="flex flex-wrap gap-2">
        {DOCUMENTS.map((doc) => (
          <a
            key={doc.id}
            href={`#${doc.id}`}
            className="flex h-10 items-center rounded-full border border-line px-5 text-[15px] font-medium hover:border-ink"
          >
            {doc.title}
          </a>
        ))}
      </nav>

      {DOCUMENTS.map((doc) => (
        <section key={doc.id} id={doc.id} className="mt-14 max-w-[70ch] scroll-mt-28 border-t border-line pt-10">
          <h2 className="text-[28px] font-medium tracking-[-0.01em]">{doc.title}</h2>
          <p className="mt-4 text-lg leading-8 text-muted">
            Tekst dokumenta biće dodat nakon pravnog pregleda.
          </p>
        </section>
      ))}
    </PageShell>
  );
}
