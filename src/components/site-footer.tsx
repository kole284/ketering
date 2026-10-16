import Link from "next/link";
import { localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/server";
import { footerLinks } from "./site-nav";

export async function SiteFooter() {
  const { locale, t } = await getDictionary();

  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-8 md:px-6 md:py-7 xl:px-12">
        <nav aria-label={t.footer.label}>
          <ul className="flex flex-col md:flex-row md:flex-wrap md:gap-x-8 md:gap-y-2">
            {footerLinks(t).map((link) => (
              <li key={link.path} className="border-b border-line md:border-0">
                <Link
                  href={localePath(locale, link.path)}
                  className="block py-3.5 text-base hover:text-accent md:py-0 md:text-[15px] md:font-medium"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-muted">{t.footer.copyright}</p>
      </div>
    </footer>
  );
}
