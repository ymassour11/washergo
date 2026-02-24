"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check } from "lucide-react";
import { useLocale } from "@/i18n";
import LanguageToggle from "@/i18n/language-toggle";
import StepPlan from "./step-plan";
import StepDetails from "./step-details";
import StepPayment from "./step-payment";
import StepConfirmation from "./step-confirmation";

type UIStep = "plan" | "details" | "payment" | "success";

interface BookingData {
  id: string;
  status: string;
  currentStep: number;
  serviceZip?: string;
  hasHookups?: boolean;
  packageType?: string;
  termType?: string;
  monthlyPriceCents?: number;
  setupFeeCents?: number;
  minimumTermMonths?: number;
  customer?: { name: string; email: string; phone: string } | null;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  floor?: number;
  hasElevator?: boolean;
  gateCode?: string;
  entryNotes?: string;
  deliveryNotes?: string;
  dryerPlugType?: string;
  hasHotColdValves?: boolean;
  hasDrainAccess?: boolean;
  deliverySlotId?: string;
  deliverySlot?: { date: string; windowLabel: string } | null;
  payAtDelivery?: boolean;
  stripeCustomerId?: string;
  contractSignedAt?: string;
  contractSignerName?: string;
}

function backendStepToUIStep(step: number): UIStep {
  if (step <= 2) return "plan";
  if (step <= 5) return "details";
  if (step === 6) return "payment";
  return "success";
}

interface StepperProps {
  bookingId: string;
  initialStep?: number;
  canceled?: boolean;
}

export default function Stepper({ bookingId, initialStep, canceled }: StepperProps) {
  const [uiStep, setUIStep] = useState<UIStep>("plan");
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLocale();

  const UI_STEPS: { key: UIStep; label: string; desc: string }[] = [
    { key: "plan", label: t("stepper.step.plan"), desc: t("stepper.step.plan.desc") },
    { key: "details", label: t("stepper.step.details"), desc: t("stepper.step.details.desc") },
    { key: "payment", label: t("stepper.step.payment"), desc: t("stepper.step.payment.desc") },
    { key: "success", label: t("stepper.step.confirmed"), desc: t("stepper.step.confirmed.desc") },
  ];

  const fetchBooking = useCallback(async () => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      if (!res.ok) throw new Error("Failed to load booking");
      const data = await res.json();
      const b = data.booking as BookingData;

      if (b.currentStep === 1) {
        try {
          const initRes = await fetch(`/api/bookings/${bookingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ step: 1, data: { serviceZip: "77001", hasHookups: true } }),
          });
          if (initRes.ok) {
            const initResult = await initRes.json();
            setBooking(initResult.booking);
          } else {
            setBooking(b);
          }
        } catch {
          setBooking(b);
        }
        setUIStep("plan");
      } else {
        setBooking(b);
        if (initialStep) {
          setUIStep(backendStepToUIStep(initialStep));
        } else {
          setUIStep(backendStepToUIStep(b.currentStep));
        }
      }
    } catch {
      setError(t("stepper.loadError"));
    } finally {
      setLoading(false);
    }
  }, [bookingId, initialStep, t]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const saveStep = async (stepNum: number, data: Record<string, unknown>): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: stepNum, data }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (result.errors) {
          const messages = Object.entries(result.errors)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`)
            .join("\n");
          setError(messages);
        } else {
          setError(result.error || t("stepper.saveError"));
        }
        return false;
      }
      setBooking(result.booking);
      return true;
    } catch {
      setError(t("stepper.networkError"));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const goToStep = (step: UIStep) => {
    setError(null);
    setUIStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const currentIndex = UI_STEPS.findIndex((s) => s.key === uiStep);
  const progress = (currentIndex / (UI_STEPS.length - 1)) * 100;

  const goBack = () => {
    if (currentIndex > 0) {
      goToStep(UI_STEPS[currentIndex - 1].key);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-slate-900">
        <div className="flex flex-col items-center gap-6">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500 tracking-wide">{t("stepper.loading")}</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-slate-900">
        <div className="text-center px-6 max-w-md">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-bold">!</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">{t("stepper.notFound.title")}</h2>
          <p className="text-slate-500">{t("stepper.notFound.desc")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col md:flex-row font-sans text-black selection:bg-brutal-blue selection:text-white">

      {/* Sidebar for Desktop / Header for Mobile */}
      <aside className="w-full md:w-80 lg:w-96 bg-white border-b-4 md:border-b-0 md:border-r-4 border-black p-4 md:p-10 lg:p-12 flex flex-col justify-between sticky top-0 md:h-screen z-40 md:overflow-y-auto">
        <div>
          <div className="mb-6 md:mb-12 flex items-center justify-between md:block">
            <a href="/" className="block">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase leading-none">
                    Go<span className="text-brutal-blue">Wash</span>
                  </h1>
                  <p className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em] mt-1 md:mt-2 text-gray-500">{t("stepper.premiumSub")}</p>
                </div>
              </div>
            </a>

            <div className="flex items-center gap-2 md:hidden">
              <LanguageToggle />
              {/* Mobile Back Button */}
              <button
                onClick={uiStep === "plan" || uiStep === "success" ? () => { window.location.href = "/book"; } : goBack}
                className="flex items-center justify-center w-10 h-10 bg-white border-2 border-black neo-brutal-shadow active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3 mb-12">
            <button
              onClick={uiStep === "plan" || uiStep === "success" ? () => { window.location.href = "/book"; } : goBack}
              className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest bg-white border-2 border-black px-4 py-2 neo-brutal-shadow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("nav.back")}
            </button>
            <LanguageToggle />
          </div>

          <div className="hidden md:flex flex-col gap-6 relative">
            {UI_STEPS.map((s, i) => {
              const isActive = s.key === uiStep;
              const isPast = UI_STEPS.findIndex(x => x.key === uiStep) > i;

              return (
                <div key={s.key} className={`flex items-center gap-4 transition-all duration-300 ${isActive ? 'translate-x-2' : ''}`}>
                  <div className={`w-10 h-10 border-3 border-black flex items-center justify-center text-sm font-black transition-all ${isActive ? 'bg-brutal-yellow neo-brutal-shadow' : isPast ? 'bg-black text-white' : 'bg-white text-gray-300'}`}>
                    {isPast ? <Check className="w-5 h-5 stroke-[3]" /> : i + 1}
                  </div>
                  <div className="flex flex-col">
                    <div className={`font-black text-xs uppercase tracking-tight ${isActive ? 'text-black' : 'text-gray-400'}`}>{s.label}</div>
                    {isActive && <div className="text-[10px] font-bold text-brutal-blue uppercase tracking-widest mt-0.5">{s.desc}</div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile step indicator */}
          <div className="md:hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[8px] font-black uppercase tracking-widest">{t("stepper.stepOf", { current: String(currentIndex + 1), total: String(UI_STEPS.length) })}</div>
              <div className="text-[10px] font-black uppercase">{UI_STEPS[currentIndex]?.label}</div>
            </div>
            <div className="h-3 w-full bg-white border-2 border-black neo-brutal-shadow overflow-hidden">
              <motion.div
                className="h-full bg-brutal-blue"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="hidden md:block pt-12 border-t-2 border-black mt-12">
          <div className="bg-brutal-pink p-4 border-3 border-black neo-brutal-shadow">
            <p className="text-[10px] font-black uppercase leading-tight">{t("stepper.needHelp")}</p>
            <a href="mailto:support@gowash.com" className="text-xs font-black uppercase underline mt-1 block">{t("stepper.contactSupport")}</a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full relative bg-[#F0F0F0]">
        {/* Banners */}
        <div className="absolute top-0 left-0 right-0 z-30">
          {canceled && (
            <div className="bg-brutal-yellow border-b-4 border-black px-4 py-3 md:px-6 md:py-4 text-center">
              <p className="text-black font-black uppercase text-[10px] md:text-xs tracking-widest">
                {t("stepper.paymentCanceled")}
              </p>
            </div>
          )}
          {error && (
            <div className="bg-brutal-pink border-b-4 border-black px-4 py-3 md:px-6 md:py-4 text-center">
              <p className="text-black font-black uppercase text-[10px] md:text-xs tracking-widest">{error}</p>
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto p-4 py-8 md:p-12 lg:p-20 pt-12 md:pt-24">
          <AnimatePresence mode="wait">
            {uiStep === "plan" && (
              <StepPlan
                key="plan"
                booking={booking}
                onSelectPackage={async (packageType: string) => {
                  await saveStep(2, { packageType });
                }}
                onSelectTerm={async (termType: string) => {
                  const success = await saveStep(2, { termType });
                  if (success) goToStep("details");
                }}
                saving={saving}
                onBack={goBack}
              />
            )}
            {uiStep === "details" && (
              <StepDetails
                key="details"
                booking={booking}
                bookingId={bookingId}
                onComplete={async (addressData, deliverySlotId) => {
                  const step3 = await saveStep(3, addressData);
                  if (!step3) return;
                  const step4 = await saveStep(4, {
                    dryerPlugType: "FOUR_PRONG",
                    hasHotColdValves: true,
                    hasDrainAccess: true,
                  });
                  if (!step4) return;
                  const step5 = await saveStep(5, { deliverySlotId });
                  if (step5) goToStep("payment");
                }}
                saving={saving}
                onBack={goBack}
              />
            )}
            {uiStep === "payment" && (
              <StepPayment
                key="payment"
                booking={booking}
                bookingId={bookingId}
                onBack={goBack}
                saving={saving}
                onPayAtDelivery={async () => {
                  const success = await saveStep(6, { payAtDelivery: true });
                  if (success) goToStep("success");
                }}
              />
            )}
            {uiStep === "success" && (
              <StepConfirmation
                key="success"
                booking={booking}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
