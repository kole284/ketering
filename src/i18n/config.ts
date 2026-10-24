export const LOCALES = ["sr", "en", "ru"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "sr";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export const LANGUAGES: { code: Locale; short: string; label: string }[] = [
  { code: "sr", short: "SR", label: "Srpski" },
  { code: "en", short: "EN", label: "English" },
  { code: "ru", short: "RU", label: "Русский" },
];

/** BCP 47 tags for Intl formatting. Serbian uses Latin script. */
export const INTL_LOCALE: Record<Locale, string> = {
  sr: "sr-Latn-RS",
  en: "en-GB",
  ru: "ru-RU",
};

export const hasLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

/** A locale from untrusted input, falling back to Serbian. */
export const parseLocale = (value: unknown): Locale => (typeof value === "string" && hasLocale(value) ? value : DEFAULT_LOCALE);

/** Prefixes an app path ("/restorani?x=1") with the locale. */
export const localePath = (locale: Locale, path: string) =>
  path === "/" ? `/${locale}` : path.startsWith("/?") ? `/${locale}${path.slice(1)}` : `/${locale}${path}`;

/** Swaps the locale segment of a pathname like "/sr/restorani". */
export function swapLocale(pathname: string, locale: Locale) {
  const [, first, ...rest] = pathname.split("/");
  const tail = hasLocale(first ?? "") ? rest : [first, ...rest].filter(Boolean);
  return `/${[locale, ...tail].join("/")}`;
}

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };

/** Picks the plural form for n and fills {n}. */
export function plural(locale: Locale, n: number, forms: PluralForms) {
  const rule = new Intl.PluralRules(INTL_LOCALE[locale]).select(n);
  return (forms[rule] ?? forms.other).replace("{n}", String(n));
}

/** Fills {name} placeholders. */
export const fill = (template: string, values: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? `{${key}}`));
