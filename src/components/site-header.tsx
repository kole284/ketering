import Link from "next/link";
import Form from "next/form";
import { BagIcon, ChevronDownIcon, GlobeIcon, SearchIcon } from "./icons";
import { CartCount } from "./cart-count";
import { MobileMenu } from "./mobile-menu";
import { CATEGORY_LINKS, LANGUAGES } from "./site-nav";

export function Logo({ className = "text-[26px]" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`font-semibold tracking-[-0.04em] text-accent ${className}`}
    >
      Servingo
    </Link>
  );
}

function SearchField() {
  return (
    <Form action="/restorani" className="relative w-full">
      <SearchIcon
        size={18}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2"
      />
      <label htmlFor="header-search" className="sr-only">
        Pretraži restorane i jela
      </label>
      <input
        id="header-search"
        name="q"
        type="search"
        placeholder="Pretraži restorane i jela"
        className="h-11 w-full rounded-full bg-surface pr-4 pl-11 text-sm placeholder:text-muted focus:bg-bg focus:ring-1 focus:ring-ink focus:outline-none"
      />
    </Form>
  );
}

// Language switching is UI only for now; i18n comes later.
function LanguageSwitch() {
  return (
    <details className="group relative">
      <summary className="flex h-11 cursor-pointer list-none items-center gap-1.5 rounded-full px-2 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
        <GlobeIcon />
        SR
        <ChevronDownIcon size={16} className="transition-transform group-open:rotate-180" />
        <span className="sr-only">Izaberi jezik</span>
      </summary>
      <ul className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-line bg-bg p-1 shadow-[0_8px_24px_rgb(0_0_0/0.08)]">
        {LANGUAGES.map((lang) => (
          <li key={lang.code}>
            <button
              type="button"
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface"
            >
              {lang.label}
              <span className="text-muted">{lang.code}</span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

function CartLink({ withLabel }: { withLabel: boolean }) {
  return (
    <Link
      href="/korpa"
      className="relative flex h-11 items-center gap-2 rounded-full px-2 text-[15px] font-medium"
    >
      <BagIcon size={22} />
      <CartCount />
      <span className={withLabel ? "" : "sr-only"}>Korpa</span>
    </Link>
  );
}

function CategoryNav({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="Kategorije" className={className}>
      <ul className="flex items-center gap-7">
        {CATEGORY_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
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

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg">
      {/* Mobile: logo + burger */}
      <div className="flex h-16 items-center justify-between px-4 md:hidden">
        <Logo className="text-[22px]" />
        <MobileMenu />
      </div>

      {/* Tablet: two rows */}
      <div className="hidden px-6 md:block xl:hidden">
        <div className="flex h-17 items-center gap-5">
          <Logo className="text-2xl" />
          <SearchField />
          <LanguageSwitch />
          <CartLink withLabel={false} />
        </div>
        <CategoryNav className="pb-3.5" />
      </div>

      {/* Desktop: one row */}
      <div className="mx-auto hidden h-20 max-w-[1440px] items-center justify-between gap-6 px-12 xl:flex">
        <div className="flex items-center gap-12">
          <Logo />
          <CategoryNav />
        </div>
        <div className="flex items-center gap-4">
          <div className="w-[360px]">
            <SearchField />
          </div>
          <LanguageSwitch />
          <CartLink withLabel />
        </div>
      </div>
    </header>
  );
}
