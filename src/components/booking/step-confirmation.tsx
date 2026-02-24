"use client";

import { motion } from "motion/react";
import { Check, CalendarDays, Package, CreditCard, Clock } from "lucide-react";
import type { TermType } from "@prisma/client";
import { useLocale, useLocaleDateFormatter } from "@/i18n";

interface Props {
  booking: {
    id: string;
    status: string;
    packageType?: string;
    termType?: string;
    deliverySlot?: { date: string; windowLabel: string } | null;
    customer?: { name: string; email: string } | null;
    monthlyPriceCents?: number;
    setupFeeCents?: number;
    payAtDelivery?: boolean;
  };
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function StepConfirmation({ booking }: Props) {
  const { t } = useLocale();
  const formatDate = useLocaleDateFormatter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center text-center py-4 md:py-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
        className="w-24 h-24 md:w-32 md:h-32 bg-brutal-green border-3 md:border-4 border-black neo-brutal-shadow-lg flex items-center justify-center mb-8 md:mb-12"
      >
        <Check className="w-12 h-12 md:w-16 md:h-16 text-black stroke-[4]" />
      </motion.div>

      <h2 className="text-4xl md:text-8xl font-black tracking-tighter text-black uppercase leading-[0.85] mb-4 md:mb-6">
        {t("confirm.title1")} <br />
        <span className="text-brutal-blue">{t("confirm.title2")}</span>
      </h2>
      <p className="text-base md:text-xl font-black uppercase tracking-tight text-black mb-8 md:mb-12 max-w-md">
        {booking.payAtDelivery ? t("confirm.bookingConfirmed") : t("confirm.orderConfirmed")}
        {booking.customer?.name && (
          <> {t("confirm.welcome", { name: "" }).split("{name}")[0]}<span className="text-brutal-blue">{booking.customer.name}</span>!</>
        )}
      </p>

      {booking.payAtDelivery && (
        <div className="bg-brutal-yellow border-3 md:border-4 border-black p-4 md:p-6 neo-brutal-shadow w-full max-w-lg mb-8 md:mb-12 text-left">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-black stroke-[3]" />
            <span className="font-black text-sm md:text-base uppercase tracking-tight">{t("confirm.paymentDueDelivery")}</span>
          </div>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-tight text-black/60 leading-relaxed">
            {t("confirm.paymentDueDeliveryDesc")}
          </p>
        </div>
      )}

      <div className="bg-white p-6 md:p-10 border-3 md:border-4 border-black neo-brutal-shadow-lg w-full max-w-lg mb-8 md:mb-12 text-left relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 md:h-4 bg-brutal-blue border-b-2 md:border-b-4 border-black"></div>

        <div className="flex justify-between items-center mb-6 md:mb-10 mt-2 md:mt-4">
          <h3 className="font-black text-xl md:text-2xl uppercase tracking-tighter">{t("confirm.orderSummary")}</h3>
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-1 md:px-3 md:py-1 border-2 border-black">
            #{booking.id.slice(0, 8)}
          </span>
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="flex gap-4 md:gap-6 items-start">
            <div className="w-10 h-10 md:w-12 md:h-12 border-2 md:border-3 border-black bg-brutal-yellow flex items-center justify-center shrink-0 neo-brutal-shadow">
              <Package className="w-5 h-5 md:w-6 md:h-6 text-black stroke-[3]" />
            </div>
            <div>
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 md:mb-1">{t("confirm.equipment")}</div>
              <div className="font-black text-lg md:text-xl uppercase tracking-tighter">{booking.packageType ? t(`config.pkg.${booking.packageType}`) : "--"}</div>
            </div>
          </div>

          {booking.termType && (
            <div className="flex gap-4 md:gap-6 items-start">
              <div className="w-10 h-10 md:w-12 md:h-12 border-2 md:border-3 border-black bg-brutal-pink flex items-center justify-center shrink-0 neo-brutal-shadow">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-black stroke-[3]" />
              </div>
              <div>
                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 md:mb-1">{t("confirm.plan")}</div>
                <div className="font-black text-lg md:text-xl uppercase tracking-tighter">{t(`config.term.${booking.termType}`)}</div>
              </div>
            </div>
          )}

          {booking.deliverySlot && (
            <div className="flex gap-4 md:gap-6 items-start">
              <div className="w-10 h-10 md:w-12 md:h-12 border-2 md:border-3 border-black bg-brutal-green flex items-center justify-center shrink-0 neo-brutal-shadow">
                <CalendarDays className="w-5 h-5 md:w-6 md:h-6 text-black stroke-[3]" />
              </div>
              <div>
                <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 md:mb-1">{t("confirm.deliveryDate")}</div>
                <div className="font-black text-lg md:text-xl uppercase tracking-tighter">{formatDate(booking.deliverySlot.date)}</div>
                <div className="text-[10px] md:text-xs font-bold uppercase tracking-tight text-gray-500 mt-1">{booking.deliverySlot.windowLabel}</div>
              </div>
            </div>
          )}

          <div className="flex gap-4 md:gap-6 items-start border-t-2 md:border-t-4 border-black pt-6 md:pt-8">
            <div className="w-10 h-10 md:w-12 md:h-12 border-2 md:border-3 border-black bg-brutal-blue flex items-center justify-center shrink-0 neo-brutal-shadow">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-white stroke-[3]" />
            </div>
            <div>
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5 md:mb-1">{t("confirm.monthlyTotal")}</div>
              <div className="font-black text-2xl md:text-4xl uppercase tracking-tighter text-brutal-blue">
                {booking.monthlyPriceCents ? `${formatCents(booking.monthlyPriceCents)}` : "--"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preparation checklist */}
      <div className="w-full max-w-lg bg-black text-white border-3 md:border-4 border-black p-6 md:p-8 text-left mb-8 md:mb-12 neo-brutal-shadow">
        <h3 className="font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-6 md:mb-8 border-b-2 border-white/20 pb-2 md:pb-4">{t("confirm.checklist")}</h3>
        <ul className="space-y-4 md:space-y-6">
          {[
            t("confirm.checklist.1"),
            t("confirm.checklist.2"),
            t("confirm.checklist.3"),
            t("confirm.checklist.4"),
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-3 md:gap-4">
              <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-white bg-brutal-blue flex items-center justify-center shrink-0">
                <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white stroke-[4]" />
              </div>
              <p className="text-[10px] md:text-xs font-black uppercase tracking-tight leading-tight pt-1">{item}</p>
            </li>
          ))}
        </ul>
      </div>

      {booking.customer?.email && (
        <p className="text-[8px] md:text-xs font-black uppercase tracking-widest text-gray-400 mb-8 md:mb-12">
          {t("confirm.receiptSentTo", { email: "" }).split("{email}")[0]}<span className="text-black">{booking.customer.email}</span>
        </p>
      )}

      <button
        onClick={() => { window.location.href = "/"; }}
        className="bg-white border-3 md:border-4 border-black px-8 py-4 md:px-12 md:py-6 font-black text-lg md:text-xl uppercase tracking-widest neo-brutal-shadow hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] transition-all"
      >
        {t("confirm.returnHome")}
      </button>
    </motion.div>
  );
}
