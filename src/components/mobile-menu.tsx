"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Form from "next/form";
import { usePathname } from "next/navigation";
import { BagIcon, ChevronRightIcon, CloseIcon, GlobeIcon, MenuIcon, SearchIcon } from "./icons";
import { CATEGORY_LINKS, LANGUAGES } from "./site-nav";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close whenever navigation happens.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="-mr-2 flex size-10 items-center justify-center"
      >
        <MenuIcon size={24} />
        <span className="sr-only">Otvori meni</span>
      </button>

      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Meni"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
            <Link href="/" className="text-[22px] font-semibold tracking-[-0.04em] text-accent">
              Servingo
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-mr-2 flex size-10 items-center justify-center"
              autoFocus
            >
              <CloseIcon size={24} />
              <span className="sr-only">Zatvori meni</span>
            </button>
          </div>

          <div className="flex flex-col gap-7 px-4 pt-6 pb-8">
            <Form action="/restorani" className="relative" onSubmit={() => setOpen(false)}>
              <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2" />
              <label htmlFor="mobile-search" className="sr-only">
                Pretraži restorane i jela
              </label>
              <input
                id="mobile-search"
                name="q"
                type="search"
                placeholder="Pretraži restorane i jela"
                className="h-12 w-full rounded-full bg-surface pr-4 pl-11 text-base placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </Form>

            <nav aria-label="Kategorije">
              <ul>
                {CATEGORY_LINKS.map((link) => (
                  <li key={link.href} className="border-b border-line">
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between py-4 text-[22px] font-medium tracking-[-0.01em]"
                    >
                      {link.label}
                      <ChevronRightIcon />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <fieldset>
              <legend className="mb-3 flex items-center gap-2 text-[13px] font-medium text-muted">
                <GlobeIcon size={18} />
                Jezik
              </legend>
              <div className="flex gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    aria-pressed={lang.code === "SR"}
                    className="h-10 rounded-full border border-line px-[18px] text-[15px] font-medium aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg"
                  >
                    {lang.code}
                  </button>
                ))}
              </div>
            </fieldset>

            <Link
              href="/korpa"
              onClick={() => setOpen(false)}
              className="flex h-13 items-center justify-center gap-2.5 rounded-full bg-accent text-[15px] font-semibold text-on-accent"
            >
              <BagIcon />
              Idi u korpu
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
