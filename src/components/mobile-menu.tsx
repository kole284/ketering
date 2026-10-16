"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Form from "next/form";
import { usePathname } from "next/navigation";
import { useI18n } from "@/i18n/provider";
import { BagIcon, ChevronRightIcon, CloseIcon, MenuIcon, SearchIcon } from "./icons";
import { LanguageButtons } from "./language-switch";
import { categoryLinks } from "./site-nav";

export function MobileMenu() {
  const { t, href } = useI18n();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close whenever navigation happens, including a language switch.
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
        <span className="sr-only">{t.header.openMenu}</span>
      </button>

      {open && (
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label={t.header.menu}
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-bg"
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
            <Link href={href("/")} className="text-[22px] font-semibold tracking-[-0.04em] text-accent">
              Servingo
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-mr-2 flex size-10 items-center justify-center"
              autoFocus
            >
              <CloseIcon size={24} />
              <span className="sr-only">{t.header.closeMenu}</span>
            </button>
          </div>

          <div className="flex flex-col gap-7 px-4 pt-6 pb-8">
            <Form action={href("/restorani")} className="relative" onSubmit={() => setOpen(false)}>
              <SearchIcon size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2" />
              <label htmlFor="mobile-search" className="sr-only">
                {t.header.search}
              </label>
              <input
                id="mobile-search"
                name="q"
                type="search"
                placeholder={t.header.search}
                className="h-12 w-full rounded-full bg-surface pr-4 pl-11 text-base placeholder:text-muted focus:ring-1 focus:ring-ink focus:outline-none"
              />
            </Form>

            <nav aria-label={t.header.categories}>
              <ul>
                {categoryLinks(t).map((link) => (
                  <li key={link.path} className="border-b border-line">
                    <Link
                      href={href(link.path)}
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

            <LanguageButtons />

            <Link
              href={href("/korpa")}
              onClick={() => setOpen(false)}
              className="flex h-13 items-center justify-center gap-2.5 rounded-full bg-accent text-[15px] font-semibold text-on-accent"
            >
              <BagIcon />
              {t.header.goToCart}
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
