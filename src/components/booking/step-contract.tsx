"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { FileText, ArrowRight, Check } from "lucide-react";
import { useLocale } from "@/i18n";

interface Props {
  booking: {
    contractSignerName?: string;
    contractSignedAt?: string;
  };
  onNext: (data: Record<string, unknown>) => void;
  onBack: () => void;
  saving: boolean;
}

export default function StepContract({ booking, onNext, saving }: Props) {
  const [accepted, setAccepted] = useState(!!booking.contractSignedAt);
  const [signerName, setSignerName] = useState(booking.contractSignerName || "");
  const [contractText, setContractText] = useState("");
  const [loadingContract, setLoadingContract] = useState(true);
  const { t, locale } = useLocale();

  useEffect(() => {
    if (booking.contractSignedAt) {
      onNext({ contractAccepted: true, signerName: booking.contractSignerName || "" });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setContractText(`WASHER/DRYER RENTAL AGREEMENT

This Rental Agreement ("Agreement") is entered into between the rental provider ("Company") and the customer ("Renter").

1. EQUIPMENT: Company agrees to rent to Renter the washer and/or dryer unit(s) as specified in the booking.

2. TERM: The minimum rental term is as specified at booking time. After the minimum term, the Agreement continues month-to-month until terminated by either party with 30 days written notice.

3. MONTHLY RENT: Renter agrees to pay the monthly rental amount specified at booking. Rent is due on the same day each month as the initial payment.

4. SETUP FEE: A one-time, non-refundable setup and delivery fee is charged at the time of booking.

5. MAINTENANCE: Company will maintain and repair the equipment at no additional charge for normal wear and tear. Renter must report any issues promptly.

6. DAMAGE: Renter is responsible for damage caused by misuse, negligence, or unauthorized modifications.

7. ACCESS: Renter agrees to provide reasonable access for maintenance and equipment retrieval.

8. TERMINATION: Either party may terminate after the minimum term with 30 days notice. Early termination may incur a fee.

9. GOVERNING LAW: This Agreement is governed by the laws of the state in which the rental property is located.`);
    setLoadingContract(false);
  }, []);

  const isValid = accepted && signerName.trim().length >= 2;

  const formattedDate = new Date().toLocaleDateString(locale === "es" ? "es-US" : "en-US", { year: "numeric", month: "long", day: "numeric" });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-8 md:mb-12">
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-black uppercase leading-[0.9] mb-4 md:mb-6">{t("contract.title1")} <span className="text-brutal-blue">{t("contract.title2")}</span></h2>
        <p className="text-black text-sm md:text-lg font-bold uppercase tracking-tight">{t("contract.subtitle")}</p>
      </div>

      {/* Contract */}
      <div className="bg-white border-3 md:border-4 border-black neo-brutal-shadow mb-8 md:mb-12 overflow-hidden">
        <div className="bg-black text-white px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3 font-black text-[10px] md:text-xs uppercase tracking-widest">
            <FileText className="w-4 h-4 md:w-5 md:h-5 text-brutal-yellow stroke-[3]" />
            {t("contract.version")}
          </div>
          <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60">{t("contract.scrollToRead")}</span>
        </div>
        <div className="p-6 md:p-8 max-h-60 md:max-h-80 overflow-y-auto custom-scrollbar bg-white">
          {loadingContract ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-3 md:h-4 w-full bg-gray-100 border-2 border-black animate-pulse" />
              ))}
            </div>
          ) : (
            <pre className="text-xs md:text-sm text-black whitespace-pre-wrap font-mono font-bold leading-relaxed">
              {contractText}
            </pre>
          )}
        </div>
      </div>

      {/* Acceptance */}
      <label
        className={`group flex items-start gap-4 md:gap-6 p-6 md:p-8 border-3 md:border-4 border-black cursor-pointer transition-all duration-200 mb-8 md:mb-12 ${
          accepted ? "bg-brutal-yellow neo-brutal-shadow-lg translate-x-[-2px] translate-y-[-2px] md:translate-x-[-4px] md:translate-y-[-4px]" : "bg-white neo-brutal-shadow hover:translate-x-[-1px] hover:translate-y-[-1px] md:hover:translate-x-[-2px] md:hover:translate-y-[-2px]"
        }`}
      >
        <div className={`mt-0.5 md:mt-1 w-6 h-6 md:w-8 md:h-8 border-2 md:border-3 border-black flex items-center justify-center shrink-0 transition-colors ${
          accepted ? "bg-black text-white" : "bg-white text-transparent group-hover:bg-gray-100"
        }`}>
          <Check className="w-4 h-4 md:w-5 md:h-5 stroke-[4]" />
        </div>
        <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="sr-only" />
        <span className="font-black text-lg md:text-xl uppercase tracking-tighter pt-0.5 md:pt-1">{t("contract.agree")}</span>
      </label>

      {/* Signature */}
      <div className="bg-white p-6 md:p-8 border-3 md:border-4 border-black neo-brutal-shadow mb-8 md:mb-12">
        <label className="block text-[10px] md:text-xs font-black uppercase tracking-widest text-gray-500 mb-3 md:mb-4">{t("contract.signLabel")}</label>
        <input
          type="text"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="YOUR FULL NAME"
          className="block w-full px-4 py-4 md:px-6 md:py-6 border-3 md:border-4 border-black bg-white text-black placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-brutal-blue/20 focus:border-brutal-blue transition-all text-xl md:text-3xl font-black uppercase tracking-tighter"
        />
        {signerName.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 md:mt-6 bg-brutal-green p-3 md:p-4 border-2 md:border-3 border-black neo-brutal-shadow inline-flex items-center gap-2 md:gap-3"
          >
            <Check className="w-4 h-4 md:w-5 md:h-5 text-black stroke-[3]" />
            <p className="text-[10px] md:text-xs font-black uppercase tracking-tight">{t("contract.signedOn", { date: formattedDate })}</p>
          </motion.div>
        )}
      </div>

      <button
        onClick={() => onNext({ contractAccepted: accepted, signerName: signerName.trim() })}
        disabled={saving || !isValid}
        className="w-full bg-brutal-blue hover:bg-black disabled:bg-gray-300 text-white border-3 md:border-4 border-black py-4 md:py-6 font-black text-lg md:text-2xl uppercase tracking-widest transition-all neo-brutal-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px] md:hover:shadow-[12px_12px_0px_0px_#000]"
      >
        {saving ? t("contract.signing") : t("contract.signComplete")}
        {!saving && <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 stroke-[3]" />}
      </button>
    </motion.div>
  );
}
