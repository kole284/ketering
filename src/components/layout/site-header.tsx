import Image from "next/image";
import Link from "next/link";
import { Building2, Menu, ShoppingCart } from "lucide-react";
import { LinkButton } from "@/components/ui/button";

type SiteHeaderProps = {
  cartCount?: number;
};

export function SiteHeader({ cartCount = 0 }: SiteHeaderProps) {
  return (
    <header className="site-nav">
      <Link href="/" className="brand-lockup" aria-label="KeteringGo početna">
        <Image
          src="/ketering-logo-20260418.png"
          alt=""
          width={180}
          height={90}
          unoptimized
          priority
          className="brand-mark"
        />
        <span className="brand-copy">
          <span className="brand-name">KeteringGo</span>
          <span className="brand-line">Ketering za firme i događaje</span>
        </span>
      </Link>

      <nav className="site-nav-links" aria-label="Glavna navigacija">
        <Link href="/restorani">Restorani</Link>
        <Link href="/#kako-funkcionise">Kako funkcioniše</Link>
        <Link href="/#faq">FAQ</Link>
      </nav>

      <div className="site-nav-actions">
        <LinkButton href="/restorani" variant="outline" className="hidden sm:inline-flex">
          <Building2 aria-hidden="true" size={17} />
          Ponuda
        </LinkButton>
        <Link href="/restorani" className="icon-button" aria-label={`Korpa, ${cartCount} stavki`}>
          <ShoppingCart aria-hidden="true" size={18} />
          <span>{cartCount}</span>
        </Link>
        <button className="icon-button md:hidden" type="button" aria-label="Otvori meni">
          <Menu aria-hidden="true" size={19} />
        </button>
      </div>
    </header>
  );
}
