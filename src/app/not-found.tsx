import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="site-shell min-h-screen">
      <div className="page-bg" />
      <section className="site-container pb-16">
        <SiteHeader />
        <section className="surface-panel mt-8 text-center">
          <p className="eyebrow">404</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-5xl">
            Stranica nije pronađena
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted-foreground)]">
            Link koji si otvorio ne vodi ka aktivnoj stranici. Možeš se vratiti na ponudu restorana ili početnu stranu.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton href="/restorani">Pregled restorana</LinkButton>
            <LinkButton href="/" variant="outline">Početna strana</LinkButton>
          </div>
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}
