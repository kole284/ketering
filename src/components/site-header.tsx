import Link from "next/link";
import Form from "next/form";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/sr";
import { getDictionary } from "@/i18n/server";
import { CartCount } from "./cart-count";
import { HeaderHeight } from "./header-height";
import { BagIcon, SearchIcon } from "./icons";
import { LanguageDropdown } from "./language-switch";
import { MobileMenu } from "./mobile-menu";
import { categoryLinks } from "./site-nav";

function Logo({ locale, className = "text-[26px]" }: { locale: Locale; className?: string }) {
  return (
    <Link href={localePath(locale, "/")} className={`shrink-0 font-semibold tracking-[-0.04em] text-accent ${className}`}>
      Servingo
    </Link>
  );
}

// Understated, COS-like: a single underline instead of a filled pill.
function SearchField({ locale, t, id }: { locale: Locale; t: Dictionary; id: string }) {
  return (
    <Form action={localePath(locale, "/restorani")} className="relative w-full">
      <SearchIcon size={16} className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2" />
      <label htmlFor={id} className="sr-only">
        {t.header.search}
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder={t.header.search}
        className="h-9 w-full border-b border-line bg-transparent pr-1 pl-6 text-[13px] placeholder:text-muted focus:border-ink focus:outline-none"
      />
    </Form>
  );
}

function CartLink({ locale, t, withLabel }: { locale: Locale; t: Dictionary; withLabel: boolean }) {
  return (
    <Link href={localePath(locale, "/korpa")} className="relative flex h-10 shrink-0 items-center gap-2 px-1">
      <BagIcon size={20} />
      <CartCount />
      <span className={withLabel ? "caps" : "sr-only"}>{t.header.cart}</span>
    </Link>
  );
}

function CategoryNav({ locale, t, className = "" }: { locale: Locale; t: Dictionary; className?: string }) {
  return (
    <nav aria-label={t.header.categories} className={className}>
      <ul className="flex items-center gap-8 2xl:gap-10">
        {categoryLinks(t).map((link) => (
          <li key={link.path}>
            <Link
              href={localePath(locale, link.path)}
              className="caps whitespace-nowrap underline-offset-[6px] hover:underline"
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
    <header className="sticky top-0 z-30 bg-bg">
      <HeaderHeight />

      {/* Mobile: logo + burger */}
      <div className="flex h-16 items-center justify-between border-b border-line px-4 md:hidden">
        <Logo locale={locale} className="text-[22px]" />
        <MobileMenu />
      </div>

      {/* Tablet: two rows */}
      <div className="hidden px-6 md:block xl:hidden">
        <div className="flex h-18 items-center gap-6">
          <Logo locale={locale} className="text-2xl" />
          <SearchField locale={locale} t={t} id="search-tablet" />
          <LanguageDropdown />
          <CartLink locale={locale} t={t} withLabel={false} />
        </div>
        <CategoryNav locale={locale} t={t} className="pb-5" />
      </div>

      {/* Desktop: one row, lots of air */}
      <div className="mx-auto hidden h-24 max-w-[1440px] items-center gap-10 px-12 xl:flex">
        <Logo locale={locale} />
        <CategoryNav locale={locale} t={t} className="shrink-0 pl-6 2xl:pl-12" />
        {/* The search field gives up width first, so longer labels (e.g. Russian) never overflow. */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-6">
          <div className="w-full max-w-[280px] min-w-0">
            <SearchField locale={locale} t={t} id="search-desktop" />
          </div>
          <LanguageDropdown />
          <CartLink locale={locale} t={t} withLabel />
        </div>
      </div>
    </header>
  );
}
