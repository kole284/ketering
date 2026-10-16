import type { ReactNode } from "react";

export function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-10 md:px-6 md:py-16 xl:px-12">
      <h1 className="caps-title text-xl leading-tight hyphens-auto [overflow-wrap:anywhere] md:text-[32px]">{title}</h1>
      {intro && <p className="mt-3 max-w-[60ch] text-lg text-muted">{intro}</p>}
      {children && <div className="mt-10">{children}</div>}
    </div>
  );
}
