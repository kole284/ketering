"use client";

import { createContext, useContext, type ReactNode } from "react";
import { localePath, type Locale } from "./config";
import type { Dictionary } from "./dictionaries/sr";

const I18nContext = createContext<{ locale: Locale; t: Dictionary } | null>(null);

export function I18nProvider({ locale, t, children }: { locale: Locale; t: Dictionary; children: ReactNode }) {
  return <I18nContext value={{ locale, t }}>{children}</I18nContext>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error("useI18n must be used inside I18nProvider");
  return { ...value, href: (path: string) => localePath(value.locale, path) };
}
