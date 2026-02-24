"use client";

import { useLocale, type Locale } from "./index";

interface Props {
  className?: string;
}

export default function LanguageToggle({ className = "" }: Props) {
  const { locale, setLocale } = useLocale();

  const options: { value: Locale; label: string }[] = [
    { value: "en", label: "EN" },
    { value: "es", label: "ES" },
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
          {opt.label}
        </button>
      ))}
    </div>
  );
}
