"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ShieldCheck, CreditCard, Lock, Truck } from "lucide-react";
import { TERMS } from "@/lib/config";
import type { TermType } from "@prisma/client";

interface Props {
  booking: {
    packageType?: string;
    termType?: string;
    monthlyPriceCents?: number;
    setupFeeCents?: number;
    minimumTermMonths?: number;
  };
  bookingId: string;
  onBack: () => void;
  saving: boolean;
  onPayAtDelivery: () => Promise<void>;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const PACKAGE_LABELS: Record<string, string> = {
  WASHER_DRYER: "Washer + Dryer",
  WASHER_ONLY: "Washer Only",
  DRYER_ONLY: "Dryer Only",
};

export default function StepPayment({ booking, bookingId, saving, onPayAtDelivery }: Props) {
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payAtDelivery, setPayAtDelivery] = useState(false);

  const termConfig = booking.termType ? TERMS[booking.termType as TermType] : null;
  const setupFee = booking.setupFeeCents ?? 0;
  const monthlyPrice = booking.monthlyPriceCents ?? 0;
  const dueToday = setupFee + monthlyPrice;

  const handlePay = async () => {
    setRedirecting(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to start payment");
        setRedirecting(false);
        return;
      }
      window.location.href = data.sessionUrl;
    } catch {
      setError("Network error. Please try again.");
      setRedirecting(false);
    }
  };

  const handlePayAtDelivery = async () => {
    setRedirecting(true);
    setError(null);
    try {
      await onPayAtDelivery();
    } catch {
      setError("Something went wrong. Please try again.");
      setRedirecting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-8 md:mb-12">
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-black uppercase leading-[0.9] mb-4 md:mb-6">Payment</h2>
        <p className="text-black text-sm md:text-lg font-bold uppercase tracking-tight">Review your order and checkout.</p>
      </div>

      {/* Order Summary */}
      <div className="bg-white p-6 md:p-8 border-3 md:border-4 border-black neo-brutal-shadow mb-8 md:mb-12">
        <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-tighter mb-6 md:mb-8 border-b-2 md:border-b-4 border-black pb-2 md:pb-4 inline-block flex items-center gap-2 md:gap-3">
          <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-brutal-blue stroke-[3]" />
          Order Summary
        </h3>
        <div className="space-y-4 md:space-y-6 text-[10px] md:text-sm font-black uppercase tracking-tight">
          {booking.packageType && (
            <div className="flex justify-between items-center pb-4 md:pb-6 border-b border-black/10">
              <span className="text-gray-400">Package</span>
              <span className="text-black">{PACKAGE_LABELS[booking.packageType] || booking.packageType}</span>
            </div>
          )}
          {termConfig && (
            <div className="flex justify-between items-center pb-4 md:pb-6 border-b border-black/10">
              <span className="text-gray-400">Term</span>
              <span className="text-black">{termConfig.label}</span>
            </div>
          )}
          {setupFee > 0 ? (
            <div className="flex justify-between items-center pb-4 md:pb-6 border-b border-black/10">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-gray-400">Delivery & setup</span>
                <span className="text-[8px] md:text-[10px] font-black tracking-widest px-1.5 py-0.5 md:px-2 md:py-1 bg-black text-white">ONE-TIME</span>
              </div>
              <span className="text-black">{formatCents(setupFee)}</span>
            </div>
          ) : (
            <div className="flex justify-between items-center pb-4 md:pb-6 border-b border-black/10">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-gray-400">Delivery & setup</span>
                <span className="text-[8px] md:text-[10px] font-black tracking-widest px-1.5 py-0.5 md:px-2 md:py-1 bg-brutal-green text-black">INCLUDED</span>
              </div>
              <span className="text-brutal-blue">Free</span>
            </div>
          )}
          <div className="flex justify-between items-center pb-4 md:pb-6 border-b-2 md:border-b-4 border-black">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-gray-400">Monthly rental</span>
              <span className="text-[8px] md:text-[10px] font-black tracking-widest px-1.5 py-0.5 md:px-2 md:py-1 bg-brutal-blue text-white">RECURRING</span>
            </div>
            <span className="text-black">{monthlyPrice ? `${formatCents(monthlyPrice)}/mo` : "--"}</span>
          </div>
          <div className="flex justify-between items-center pt-4 md:pt-6">
            <span className="text-xl md:text-2xl text-black font-black">
              {payAtDelivery ? "Due at delivery" : "Due today"}
            </span>
            <span className="text-4xl md:text-6xl font-black tracking-tighter text-brutal-blue">
              {dueToday > 0 ? formatCents(dueToday) : "--"}
            </span>
          </div>
        </div>
      </div>

      {/* Pay at Delivery Checkbox */}
      <label className="flex items-start gap-4 bg-white p-5 md:p-6 border-3 md:border-4 border-black neo-brutal-shadow mb-8 md:mb-12 cursor-pointer select-none group hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_#000] transition-all">
        <div className="relative mt-0.5">
          <input
            type="checkbox"
            checked={payAtDelivery}
            onChange={(e) => setPayAtDelivery(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-6 h-6 md:w-7 md:h-7 border-3 border-black bg-white peer-checked:bg-brutal-yellow transition-colors flex items-center justify-center">
            {payAtDelivery && (
              <svg className="w-4 h-4 md:w-5 md:h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 md:gap-3">
            <Truck className="w-5 h-5 md:w-6 md:h-6 text-brutal-blue stroke-[3]" />
            <span className="font-black text-sm md:text-base uppercase tracking-tight">Pay at delivery</span>
          </div>
          <p className="text-[10px] md:text-xs font-bold uppercase tracking-tight text-gray-400 mt-1.5 md:mt-2 leading-relaxed">
            Skip online payment. Pay when we deliver your equipment.
          </p>
        </div>
      </label>

      {error && (
        <div className="bg-brutal-pink text-black border-3 md:border-4 border-black p-4 md:p-6 font-black uppercase tracking-tight text-xs md:text-sm mb-8 md:mb-12 flex items-center gap-3 md:gap-4 neo-brutal-shadow">
           <svg className="w-6 h-6 md:w-8 md:h-8 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}

      {payAtDelivery ? (
        <button
          onClick={handlePayAtDelivery}
          disabled={redirecting || saving}
          className="w-full bg-brutal-green hover:bg-black disabled:bg-gray-300 text-black hover:text-white border-3 md:border-4 border-black py-4 md:py-6 font-black text-lg md:text-2xl uppercase tracking-widest transition-all neo-brutal-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px] md:hover:shadow-[12px_12px_0px_0px_#000]"
        >
          {redirecting || saving ? "Confirming..." : "Confirm Booking"}
          {!redirecting && !saving && <Truck className="w-5 h-5 md:w-6 md:h-6 ml-2 stroke-[3] inline" />}
        </button>
      ) : (
        <button
          onClick={handlePay}
          disabled={redirecting}
          className="w-full bg-brutal-blue hover:bg-black disabled:bg-gray-300 text-white border-3 md:border-4 border-black py-4 md:py-6 font-black text-lg md:text-2xl uppercase tracking-widest transition-all neo-brutal-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px] md:hover:shadow-[12px_12px_0px_0px_#000]"
        >
          {redirecting ? "Redirecting..." : "Pay & Subscribe"}
          {!redirecting && <Lock className="w-5 h-5 md:w-6 md:h-6 ml-2 stroke-[3] inline" />}
        </button>
      )}

      <div className="mt-8 md:mt-12 flex flex-wrap items-center justify-center gap-x-6 md:gap-x-12 gap-y-3 md:gap-y-4 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
        <span className="flex items-center gap-1.5 md:gap-2">
          <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-brutal-green stroke-[3]" /> Secure checkout
        </span>
        {!payAtDelivery && (
          <span className="flex items-center gap-1.5 md:gap-2">
            <Lock className="w-4 h-4 md:w-5 md:h-5 text-gray-400 stroke-[3]" /> Powered by Stripe
          </span>
        )}
      </div>
    </motion.div>
  );
}
