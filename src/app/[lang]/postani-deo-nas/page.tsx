import type { Metadata } from "next";
import { PageShell } from "@/components/page-shell";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: `${t.partner.title} | Servingo` };
}

export default async function PartnershipPage() {
  const { t } = await getDictionary();
  return <PageShell title={t.partner.title} intro={t.partner.intro} />;
}
