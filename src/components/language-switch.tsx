"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LANGUAGES, LOCALE_COOKIE, swapLocale, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";
import { ChevronDownIcon, GlobeIcon } from "./icons";

/** Goes to the same page in another language and remembers the choice. */
function useSwitchLanguage() {
  const pathname = usePathname();
  const router = useRouter();
  return (locale: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    router.push(swapLocale(pathname, locale) + window.location.search);
  };
}

export function LanguageDropdown() {
  const { locale, t } = useI18n();
  const switchTo = useSwitchLanguage();
  const details = useRef<HTMLDetailsElement>(null);
  const current = LANGUAGES.find((lang) => lang.code === locale)!;

  return (
    <details ref={details} className="group relative">
      <summary className="flex h-11 cursor-pointer list-none items-center gap-1.5 rounded-full px-2 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
        <GlobeIcon />
        {current.short}
        <ChevronDownIcon size={16} className="transition-transform group-open:rotate-180" />
        <span className="sr-only">{t.header.chooseLanguage}</span>
      </summary>
      <ul className="absolute right-0 z-20 mt-2 w-40 rounded-xl border border-line bg-bg p-1 shadow-[0_8px_24px_rgb(0_0_0/0.08)]">
        {LANGUAGES.map((lang) => (
          <li key={lang.code}>
            <button
              type="button"
              lang={lang.code}
              aria-current={lang.code === locale}
              onClick={() => {
                details.current?.removeAttribute("open");
                if (lang.code !== locale) switchTo(lang.code);
              }}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-surface aria-current:font-medium"
            >
              {lang.label}
              <span className="text-muted">{lang.short}</span>
            </button>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function LanguageButtons() {
  const { locale, t } = useI18n();
  const switchTo = useSwitchLanguage();

  return (
    <fieldset>
      <legend className="mb-3 flex items-center gap-2 text-[13px] font-medium text-muted">
        <GlobeIcon size={18} />
        {t.header.language}
      </legend>
      <div className="flex gap-2">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            lang={lang.code}
            aria-label={lang.label}
            aria-pressed={lang.code === locale}
            onClick={() => lang.code !== locale && switchTo(lang.code)}
            className="h-10 rounded-full border border-line px-[18px] text-[15px] font-medium aria-pressed:border-ink aria-pressed:bg-ink aria-pressed:text-bg"
          >
            {lang.short}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
