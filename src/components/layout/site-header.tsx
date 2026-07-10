"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingCart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils/cn";
import logoImage from "../../../public/ketering-logo-20260418.png";

type SiteHeaderProps = {
  cartCount?: number;
};

type NavigationItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

const navigationItems: NavigationItem[] = [
  {
    href: "/restorani",
    label: "Restorani",
    match: (pathname) => pathname.startsWith("/restorani"),
  },
  {
    href: "/#kako-funkcionise",
    label: "Kako funkcioniše",
    match: (pathname) => pathname === "/",
  },
  {
    href: "/faq",
    label: "FAQ",
    match: (pathname) => pathname === "/faq",
  },
];

function BrandLogo() {
  return (
    <Link href="/" className="brand-lockup" aria-label="KeteringGo početna">
      <Image
        src={logoImage}
        alt=""
        unoptimized
        priority
        className="brand-mark"
      />
      <span className="brand-copy">
        <span className="brand-name">KeteringGo</span>
        <span className="brand-line">Ketering platforma</span>
      </span>
    </Link>
  );
}

function DesktopNavigation({ pathname }: { pathname: string }) {
  return (
    <nav className="site-nav-links" aria-label="Glavna navigacija">
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="site-nav-link"
          aria-current={item.match(pathname) ? "page" : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function CartButton({ cartCount }: { cartCount: number }) {
  return (
    <Link href="/restorani" className="header-cart-button" aria-label={`Korpa, ${cartCount} stavki`}>
      <ShoppingCart aria-hidden="true" size={19} />
      <span className="cart-count-badge" aria-hidden="true">
        {cartCount}
      </span>
    </Link>
  );
}

function MobileNavigation({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);

  const mobileDrawer = isOpen && typeof document !== "undefined"
    ? createPortal(
        <div className="mobile-nav-layer">
          <button className="mobile-nav-scrim" type="button" aria-label="Zatvori meni" onClick={() => setIsOpen(false)} />
          <aside
            ref={drawerRef}
            id="mobile-navigation"
            className="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobilna navigacija"
          >
            <div className="mobile-nav-header">
              <BrandLogo />
              <button
                ref={closeButtonRef}
                className="header-menu-button"
                type="button"
                aria-label="Zatvori meni"
                onClick={() => setIsOpen(false)}
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            <nav className="mobile-nav-links" aria-label="Mobilna glavna navigacija">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("mobile-nav-link", item.match(pathname) && "mobile-nav-link-active")}
                  aria-current={item.match(pathname) ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>,
        document.body,
      )
    : null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) {
        return;
      }

      const focusableElements = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        className="header-menu-button"
        type="button"
        aria-label="Otvori meni"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        onClick={() => setIsOpen(true)}
      >
        <Menu aria-hidden="true" size={20} />
      </button>

      {mobileDrawer}
    </>
  );
}

export function SiteHeader({ cartCount = 0 }: SiteHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="site-nav">
      <BrandLogo />
      <DesktopNavigation pathname={pathname} />
      <div className="site-nav-actions">
        <Link href="/restorani" className="header-cta">
          Pregled ponude
        </Link>
        <CartButton cartCount={cartCount} />
        <MobileNavigation pathname={pathname} />
      </div>
    </header>
  );
}
