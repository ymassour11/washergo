"use client";

import { ArrowLeft } from "lucide-react";
import { useLocale } from "@/i18n";
import LanguageToggle from "@/i18n/language-toggle";

export default function PrivacyPage() {
  const { t } = useLocale();

  const sections = Array.from({ length: 9 }, (_, i) => {
    const n = i + 1;
    return {
      title: t(`privacy.s${n}.title`),
      body: t(`privacy.s${n}.body`),
    };
  });

  return (
    <div className="min-h-screen bg-white text-black font-mono">
      <nav className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-white sticky top-0 z-50">
        <a href="/" className="text-3xl font-sans font-bold tracking-tighter uppercase">GoWash</a>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <a
            href="/"
            className="flex items-center gap-2 text-sm font-bold uppercase bg-white border-2 border-black px-4 py-2 brutal-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("nav.back")}
          </a>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-5xl md:text-7xl font-sans font-bold uppercase tracking-tighter mb-4">{t("privacy.title")}</h1>
        <p className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-12">{t("privacy.lastUpdated")}</p>

        <div className="space-y-10 text-base leading-relaxed font-medium">
          {sections.map((s, i) => (
            <section key={i}>
              <h2 className="text-2xl font-sans font-bold uppercase mb-4">{s.title}</h2>
              {i === 8 ? (
                <p>{s.body} <a href="mailto:hello@washerdryer.com" className="text-[#0055FF] underline underline-offset-4">hello@washerdryer.com</a>.</p>
              ) : (
                <p>{s.body}</p>
              )}
            </section>
          ))}
        </div>
      </main>

      <footer className="bg-white p-8 md:p-12 border-t-4 border-black flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-4xl font-sans font-bold tracking-tighter uppercase">GoWash.</div>
        <div className="flex gap-8 text-base font-bold uppercase">
          <a href="/terms" className="hover:text-[#0055FF] hover:underline underline-offset-4">{t("nav.terms")}</a>
          <span className="text-gray-400">{t("nav.privacy")}</span>
        </div>
      </footer>
    </div>
  );
}
