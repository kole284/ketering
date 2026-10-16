import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { hasLocale, type Locale } from "./config";
import en from "./dictionaries/en";
import ru from "./dictionaries/ru";
import sr, { type Dictionary } from "./dictionaries/sr";

const DICTIONARIES: Record<Locale, Dictionary> = { sr, en, ru };

/** Current locale from the [lang] root segment; 404 for unknown locales. */
export async function getLocale(): Promise<Locale> {
  const locale = await lang();
  if (!hasLocale(locale)) notFound();
  return locale;
}

export async function getDictionary() {
  const locale = await getLocale();
  return { locale, t: DICTIONARIES[locale] };
}

export const dictionaryFor = (locale: Locale) => DICTIONARIES[locale];
