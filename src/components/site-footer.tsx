import Link from "next/link";
import { FOOTER_LINKS } from "./site-nav";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-8 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-x-8 md:px-6 md:py-7 xl:px-12">
        <nav aria-label="Podnožje">
          <ul className="flex flex-col md:flex-row md:flex-wrap md:gap-x-8 md:gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href} className="border-b border-line md:border-0">
                <Link
                  href={link.href}
                  className="block py-3.5 text-base hover:text-accent md:py-0 md:text-[15px] md:font-medium"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-muted">© 2026 Servingo. Sva prava zadržana.</p>
      </div>
    </footer>
  );
}
