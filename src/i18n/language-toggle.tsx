"use client";

import { useLocale, type Locale } from "./index";

interface Props {
  className?: string;
}

export default function LanguageToggle({ className = "" }: Props) {
  const { locale, setLocale } = useLocale();

  const options: { value: Locale; flag: string; label: string }[] = [
    { value: "en", flag: "\u{1F1FA}\u{1F1F8}", label: "EN" },
    { value: "es", flag: "\u{1F1F2}\u{1F1FD}", label: "ES" },
  ];

  return (
    <div
      className={`inline-flex border-2 border-black bg-white overflow-hidden ${className}`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setLocale(opt.value)}
          className={`px-3 py-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors ${
            locale === opt.value
              ? "bg-black text-white"
              : "bg-white text-black hover:bg-gray-100"
          }`}
        >
          <span className="mr-1">{opt.flag}</span>{opt.label}
        </button>
      ))}
    </div>
  );
}
