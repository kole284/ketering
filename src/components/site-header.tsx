import Link from "next/link";
import Form from "next/form";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/sr";
import { getDictionary } from "@/i18n/server";
import { CartCount } from "./cart-count";
import { BagIcon, SearchIcon } from "./icons";
import { LanguageDropdown } from "./language-switch";
import { MobileMenu } from "./mobile-menu";
import { categoryLinks } from "./site-nav";

function Logo({ locale, className = "text-[26px]" }: { locale: Locale; className?: string }) {
  return (
    <Link href={localePath(locale, "/")} className={`font-semibold tracking-[-0.04em] text-accent ${className}`}>
      Servingo
    </Link>
  );
}

function SearchField({ locale, t, id }: { locale: Locale; t: Dictionary; id: string }) {
  return (
    <Form action={localePath(locale, "/restorani")} className="relative w-full">
      <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2" />
      <label htmlFor={id} className="sr-only">
        {t.header.search}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder={t.header.search}
        className="h-11 w-full rounded-full bg-surface pr-4 pl-11 text-sm placeholder:text-muted focus:bg-bg focus:ring-1 focus:ring-ink focus:outline-none"
      />
    </Form>
  );
}

function CartLink({ locale, t, withLabel }: { locale: Locale; t: Dictionary; withLabel: boolean }) {
  return (
    <Link
      href={localePath(locale, "/korpa")}
      className="relative flex h-11 items-center gap-2 rounded-full px-2 text-[15px] font-medium"
    >
      <BagIcon size={22} />
      <CartCount />
      <span className={withLabel ? "" : "sr-only"}>{t.header.cart}</span>
    </Link>
  );
}

function CategoryNav({ locale, t, className = "" }: { locale: Locale; t: Dictionary; className?: string }) {
  return (
    <nav aria-label={t.header.categories} className={className}>
      <ul className="flex items-center gap-6 2xl:gap-7">
        {categoryLinks(t).map((link) => (
          <li key={link.path}>
            <Link
              href={localePath(locale, link.path)}
              className="text-[15px] font-medium whitespace-nowrap hover:text-accent"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export async function SiteHeader() {
  const { locale, t } = await getDictionary();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      {/* Mobile: logo + burger */}
      <div className="flex h-16 items-center justify-between px-4 md:hidden">
        <Logo locale={locale} className="text-[22px]" />
        <MobileMenu />
      </div>

      {/* Tablet: two rows */}
      <div className="hidden px-6 md:block xl:hidden">
        <div className="flex h-17 items-center gap-5">
          <Logo locale={locale} className="text-2xl" />
          <SearchField locale={locale} t={t} id="search-tablet" />
          <LanguageDropdown />
          <CartLink locale={locale} t={t} withLabel={false} />
        </div>
        <CategoryNav locale={locale} t={t} className="pb-3.5" />
      </div>

      {/* Desktop: one row */}
      <div className="mx-auto hidden h-20 max-w-[1440px] items-center justify-between gap-6 px-12 xl:flex">
        <div className="flex shrink-0 items-center gap-10 2xl:gap-12">
          <Logo locale={locale} />
          <CategoryNav locale={locale} t={t} />
        </div>
        {/* The search field gives up width first, so longer labels (e.g. Russian) never overflow. */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          <div className="w-full max-w-[360px] min-w-0">
            <SearchField locale={locale} t={t} id="search-desktop" />
          </div>
          <LanguageDropdown />
          <CartLink locale={locale} t={t} withLabel />
        </div>
      </div>
    </header>
  );
}
