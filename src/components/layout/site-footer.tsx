import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="site-container flex flex-col gap-4 py-8 text-sm text-[color:var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-[color:var(--foreground)]">KeteringGo</p>
          <p className="mt-1">Platforma za organizovano poručivanje keteringa.</p>
        </div>
        <nav className="flex flex-wrap gap-4" aria-label="Footer navigacija">
          <Link href="/restorani">Restorani</Link>
          <Link href="/#kako-funkcionise">Kako funkcioniše</Link>
          <Link href="/faq">FAQ</Link>
        </nav>
      </div>
    </footer>
  );
}
