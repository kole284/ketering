import Link from "next/link";
import { PageShell } from "@/components/page-shell";
import { localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";

export default async function NotFound() {
  const { locale, t } = await getDictionary();
  return (
    <PageShell title={t.notFound.title} intro={t.notFound.text}>
      <Link
        href={localePath(locale, "/")}
        className="inline-flex h-12 items-center rounded-full bg-accent px-7 text-[15px] font-semibold text-on-accent hover:bg-accent-strong"
      >
        {t.notFound.home}
      </Link>
    </PageShell>
  );
}
