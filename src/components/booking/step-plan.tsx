"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Sparkles,
  Zap,
  Droplets,
  Wind,
  ArrowRight,
} from "lucide-react";
import { PRICING, TERM_ORDER } from "@/lib/config";
import type { PackageType, TermType } from "@prisma/client";
import { useLocale } from "@/i18n";

interface Props {
  booking: { packageType?: string; termType?: string };
  onSelectPackage: (packageType: string) => Promise<void>;
  onSelectTerm: (termType: string) => Promise<void>;
  saving: boolean;
  onBack: () => void;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const TERM_ICONS: Record<string, React.ReactNode> = {
  MONTH_TO_MONTH: <Zap className="w-4 h-4" />,
  SIX_MONTH: <Check className="w-4 h-4" />,
  TWELVE_MONTH: <Sparkles className="w-4 h-4" />,
};

const PKG_ICONS: Record<string, React.ReactNode> = {
  WASHER_DRYER: <Sparkles className="w-4 h-4" />,
  WASHER_ONLY: <Droplets className="w-4 h-4" />,
  DRYER_ONLY: <Wind className="w-4 h-4" />,
};

const PKG_ORDER: PackageType[] = ["WASHER_DRYER", "WASHER_ONLY", "DRYER_ONLY"];
const DISPLAY_TERM_ORDER: TermType[] = [...TERM_ORDER].reverse();

function getMonthlySavings(pkgType: PackageType, termKey: TermType): number {
  return (
    PRICING[pkgType].MONTH_TO_MONTH.monthlyPriceCents -
    PRICING[pkgType][termKey].monthlyPriceCents
  );
}

export default function StepPlan({
  booking,
  onSelectPackage,
  onSelectTerm,
  saving,
}: Props) {
  const { t } = useLocale();

  const effectivePkgType: PackageType =
    (booking.packageType as PackageType) ?? "WASHER_DRYER";

  useEffect(() => {
    if (!booking.packageType) {
      onSelectPackage("WASHER_DRYER");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const TERM_PERKS: Record<string, string[]> = {
    MONTH_TO_MONTH: [],
    SIX_MONTH: [],
    TWELVE_MONTH: [
      t("config.term.TWELVE_MONTH.perk1"),
      t("config.term.TWELVE_MONTH.perk2"),
      t("config.term.TWELVE_MONTH.perk3"),
    ],
  };

  return (
    <div className="w-full font-sans">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="space-y-12"
      >
        {/* Header */}
        <div className="text-left space-y-4 md:space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: EASE }}
            className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter text-black uppercase leading-[0.85]"
          >
            {t("plan.title1")} <br />
            <span className="text-brutal-blue">{t("plan.title2")}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: EASE }}
            className="text-black text-base md:text-xl font-bold uppercase tracking-wide max-w-2xl"
          >
            {t("plan.subtitle")}
          </motion.p>
        </div>

        {/* Equipment Selection */}
        <div className="flex flex-col items-start space-y-6 md:space-y-8">
          <div className="flex flex-wrap gap-2 md:gap-4">
            {PKG_ORDER.map((key) => {
              const isActive = effectivePkgType === key;
              return (
                <button
                  key={key}
                  disabled={saving}
                  onClick={() => {
                    if (!saving && !isActive) onSelectPackage(key);
                  }}
                  className={`group relative px-4 py-3 md:px-8 md:py-4 border-2 md:border-4 border-black font-black uppercase tracking-widest text-[10px] md:text-sm transition-all outline-none ${
                    isActive
                      ? "bg-brutal-yellow text-black neo-brutal-shadow translate-x-[-2px] translate-y-[-2px] md:neo-brutal-shadow-lg md:translate-x-[-4px] md:translate-y-[-4px]"
                      : "bg-white text-black hover:bg-gray-50 neo-brutal-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] md:hover:translate-x-[-2px] md:hover:translate-y-[-2px]"
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2 md:gap-4">
                    <div className={`transition-transform duration-300 ${isActive ? 'scale-110 md:scale-125' : 'group-hover:scale-110 md:group-hover:scale-125'}`}>
                      {PKG_ICONS[key]}
                    </div>
                    <span>{t(`config.pkg.${key}`)}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Equipment Description */}
          <AnimatePresence mode="wait">
            <motion.div
              key={effectivePkgType}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-3 md:gap-4 text-black"
            >
              <div className="w-2 h-2 md:w-3 md:h-3 bg-brutal-blue border md:border-2 border-black shrink-0" />
              <p className="text-[10px] md:text-sm font-black uppercase tracking-widest opacity-80 leading-relaxed">
                {t(`config.pkg.${effectivePkgType}.desc`)}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="h-2 md:h-3 w-full bg-black -mt-8" />

        {/* Term Cards */}
        <div className="space-y-6 md:space-y-10">
          <div className="text-left">
            <h3 className="text-xl md:text-3xl font-black text-black uppercase tracking-tighter">
              {t("plan.selectTerm")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {DISPLAY_TERM_ORDER.map((termKey, index) => {
              const pricing = PRICING[effectivePkgType][termKey];
              const isBestValue = termKey === "TWELVE_MONTH";
              const monthlySavings = getMonthlySavings(effectivePkgType, termKey);
              const badge = t(`config.term.${termKey}.badge`);
              const hasBadge = badge !== `config.term.${termKey}.badge`;
              const perks = TERM_PERKS[termKey] || [];

              return (
                <motion.button
                  key={termKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.5, ease: EASE }}
                  disabled={saving}
                  onClick={() => !saving && onSelectTerm(termKey)}
                  className={`group relative flex flex-col p-6 md:p-10 text-left border-4 border-black transition-all duration-200 outline-none ${
                    isBestValue
                      ? "bg-brutal-blue text-white neo-brutal-shadow-lg hover:translate-x-[-4px] hover:translate-y-[-4px] md:hover:translate-x-[-6px] md:hover:translate-y-[-6px] md:hover:shadow-[14px_14px_0px_0px_#000]"
                      : "bg-white text-black neo-brutal-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px] md:hover:shadow-[10px_10px_0px_0px_#000]"
                  }`}
                >
                  {isBestValue && hasBadge && (
                    <div className="absolute -top-4 md:-top-6 left-6 md:left-8">
                      <span className="px-4 py-2 md:px-6 md:py-3 bg-brutal-yellow text-black text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border-2 md:border-4 border-black neo-brutal-shadow">
                        {badge}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
                      <div className={`w-10 h-10 md:w-12 md:h-12 border-2 md:border-3 border-black flex items-center justify-center shrink-0 ${isBestValue ? "bg-white text-black" : "bg-brutal-blue text-white"}`}>
                        {TERM_ICONS[termKey]}
                      </div>
                      <h4 className="font-black text-lg md:text-2xl uppercase tracking-tighter">{t(`config.term.${termKey}`)}</h4>
                    </div>

                    <p className={`text-[10px] md:text-sm font-bold uppercase tracking-wide mb-6 md:mb-10 leading-relaxed ${isBestValue ? "text-white/90" : "text-black/70"}`}>
                      {t(`config.term.${termKey}.desc`)}
                    </p>

                    <div className="mb-6 md:mb-10">
                      <div className="flex items-baseline gap-2 md:gap-3">
                        <span className="text-4xl md:text-7xl font-black tracking-tighter">
                          {formatCents(pricing.monthlyPriceCents)}
                        </span>
                        <span className={`text-xs md:text-base font-black uppercase tracking-widest ${isBestValue ? "text-white/60" : "text-black/40"}`}>
                          {t("plan.perMonth")}
                        </span>
                      </div>
                      <div className="h-8 md:h-10 mt-2 md:mt-4">
                        {monthlySavings > 0 && (
                          <span className={`inline-block px-3 py-1 md:px-4 md:py-2 border-2 md:border-3 border-black text-[10px] md:text-xs font-black uppercase tracking-widest ${isBestValue ? "bg-brutal-yellow text-black" : "bg-brutal-green text-black"}`}>
                            {t("plan.save", { amount: formatCents(monthlySavings) })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`h-1 md:h-1.5 w-full mb-6 md:mb-10 ${isBestValue ? "bg-white/30" : "bg-black/10"}`} />

                    <ul className="space-y-3 md:space-y-5 mb-8 md:mb-12 flex-1">
                      <li className="flex items-start gap-3 md:gap-4">
                        <div className={`w-5 h-5 md:w-6 md:h-6 border-2 md:border-3 border-black flex items-center justify-center shrink-0 ${isBestValue ? "bg-white text-black" : "bg-black text-white"}`}>
                          <Check className="w-3 h-3 md:w-4 md:h-4 stroke-[4]" />
                        </div>
                        <span className="text-[10px] md:text-sm font-black uppercase tracking-wide leading-snug">
                          {pricing.setupFeeCents === 0
                            ? t("plan.freeDelivery")
                            : t("plan.deliveryFee", { amount: formatCents(pricing.setupFeeCents) })}
                        </span>
                      </li>
                      {perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-3 md:gap-4">
                          <div className={`w-5 h-5 md:w-6 md:h-6 border-2 md:border-3 border-black flex items-center justify-center shrink-0 ${isBestValue ? "bg-white text-black" : "bg-black text-white"}`}>
                            <Check className="w-3 h-3 md:w-4 md:h-4 stroke-[4]" />
                          </div>
                          <span className="text-[10px] md:text-sm font-black uppercase tracking-wide leading-snug">
                            {perk}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4 md:pt-6 mt-auto">
                      <div className={`flex items-center justify-center gap-3 md:gap-4 w-full py-4 md:py-6 border-2 md:border-4 border-black text-xs md:text-base font-black uppercase tracking-[0.15em] transition-all ${
                        isBestValue
                          ? "bg-white text-black group-hover:bg-brutal-yellow"
                          : "bg-brutal-blue text-white group-hover:bg-black"
                      }`}>
                        {t("plan.selectPlan")}
                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 stroke-[3]" />
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black text-white p-6 border-4 border-black neo-brutal-shadow">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-center">
            {t("plan.footer")}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
