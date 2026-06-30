import type { ReactNode } from "react";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function SectionHeader({ eyebrow, title, description, action }: SectionHeaderProps) {
  return (
    <div className="section-heading">
      <div className="max-w-3xl">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[color:var(--foreground)] sm:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)] sm:text-base">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
