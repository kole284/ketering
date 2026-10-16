import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.about.title} | Servingo` };
}

export default async function AboutPage() {
  const { t } = await getDictionary();
  return <PageShell title={t.about.title} intro={t.about.intro} />;
}
