import type { Metadata } from "next";
import { Onest } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LOCALES } from "@/i18n/config";
import { I18nProvider } from "@/i18n/provider";
import { getDictionary } from "@/i18n/server";
import { ConfigProvider } from "@/lib/config";
import { getConfig } from "@/server/catalog";
import "../globals.css";

// Onest covers Latin and Cyrillic, which the SR/EN/RU language switch needs.
const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDictionary();
  return { title: t.meta.title, description: t.meta.description };
}

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const [{ locale, t }, config] = await Promise.all([getDictionary(), getConfig()]);

  return (
    <html lang={locale} className={`${onest.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <I18nProvider locale={locale} t={t}>
          <ConfigProvider config={config}>
            <SiteHeader />
            <main className="flex flex-1 flex-col">{children}</main>
            <SiteFooter />
          </ConfigProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
