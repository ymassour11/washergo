"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import en from "./locales/en.json";
import es from "./locales/es.json";

export type Locale = "en" | "es";

const dictionaries: Record<Locale, Record<string, string>> = { en, es };

const STORAGE_KEY = "gowash-locale";

function detectLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "es") return stored;
  const nav = navigator.language || "";
  if (nav.startsWith("es")) return "es";
  return "en";
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(detectLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = locale;
    }
  }, [locale, mounted]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let str = dictionaries[locale][key] ?? dictionaries.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [locale],
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}

/** Get translated package label */
export function usePackageLabel(pkgType: string) {
  const { t } = useLocale();
  return t(`config.pkg.${pkgType}`);
}

/** Get translated term label */
export function useTermLabel(termType: string) {
  const { t } = useLocale();
  return t(`config.term.${termType}`);
}

/** Format a date using the current locale */
export function useLocaleDateFormatter() {
  const { locale } = useLocale();
  return useCallback(
    (dateStr: string, opts?: Intl.DateTimeFormatOptions) => {
      const d = new Date(dateStr);
      return d.toLocaleDateString(locale === "es" ? "es-US" : "en-US", opts ?? {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    },
    [locale],
  );
}

/** Get the month/year label for a Date using current locale */
export function useMonthYearFormatter() {
  const { locale } = useLocale();
  return useCallback(
    (date: Date) =>
      date.toLocaleString(locale === "es" ? "es-US" : "default", {
        month: "long",
        year: "numeric",
      }),
    [locale],
  );
}
