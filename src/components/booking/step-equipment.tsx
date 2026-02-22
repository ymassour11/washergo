"use client";

import { motion } from "motion/react";
import { CheckCircle2, Sparkles, Wind, Droplets, Info } from "lucide-react";
import { PACKAGES, getStartingPrice } from "@/lib/config";

interface Props {
  booking: { packageType?: string };
  onSelect: (packageType: string) => void;
  saving: boolean;
}

const packageList = Object.values(PACKAGES);

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

const getPackageIcon = (type: string) => {
  switch (type) {
    case "WASHER_DRYER": return <Sparkles className="w-6 h-6" />;
    case "WASHER_ONLY": return <Droplets className="w-6 h-6" />;
    case "DRYER_ONLY": return <Wind className="w-6 h-6" />;
    default: return <Sparkles className="w-6 h-6" />;
  }
};

export default function StepEquipment({ booking, onSelect, saving }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-900 mb-3">What do you need?</h2>
        <p className="text-slate-500 text-lg">All machines are modern, energy-efficient models delivering premium performance.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {packageList.map((pkg) => {
          const isSelected = booking.packageType === pkg.type;
          const isCombo = pkg.type === "WASHER_DRYER";
          const startingPrice = getStartingPrice(pkg.type);

          return (
            <button
              key={pkg.type}
              onClick={() => !saving && onSelect(pkg.type)}
              disabled={saving}
              className={`group relative flex flex-col h-full rounded-3xl text-left transition-all duration-500 overflow-hidden ${
                isSelected
                  ? "bg-indigo-600 ring-2 ring-indigo-600 ring-offset-2 shadow-xl shadow-indigo-600/20 transform -translate-y-1 scale-[1.02]"
                  : "bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1"
              }`}
            >
              {isCombo && (
                <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-indigo-500 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity duration-500`} />
              )}

              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3 rounded-2xl transition-colors duration-500 ${
                    isSelected ? "bg-white/10 text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                  }`}>
                    {getPackageIcon(pkg.type)}
                  </div>

                  {isCombo && !isSelected && (
                    <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <Sparkles className="w-3 h-3" /> Best Value
                    </span>
                  )}
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-white text-indigo-700 shadow-sm"
                    >
                      Selected
                    </motion.span>
                  )}
                </div>

                <div className="mb-6">
                  <h3 className={`font-semibold text-2xl mb-1 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{pkg.label}</h3>
                  <p className={`text-sm leading-relaxed ${isSelected ? "text-indigo-100" : "text-slate-500"}`}>
                    {pkg.description}
                  </p>
                </div>

                <div className="mt-auto pt-6 border-t border-dashed border-slate-200/50">
                  <div className="flex items-end gap-1 mb-6">
                    <span className={`text-xs font-medium mb-1.5 ${isSelected ? "text-indigo-200" : "text-slate-400"}`}>
                      from
                    </span>
                    <span className={`text-4xl font-bold tracking-tight ${isSelected ? "text-white" : "text-slate-900"}`}>
                      {formatCents(startingPrice)}
                    </span>
                    <span className={`text-sm font-medium mb-1.5 ${isSelected ? "text-indigo-200" : "text-slate-500"}`}>
                      /mo
                    </span>
                  </div>

                  <ul className="space-y-3">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 shrink-0 transition-colors ${
                          isSelected ? "text-indigo-300" : "text-emerald-500"
                        }`} />
                        <span className={`text-sm leading-tight ${
                          isSelected ? "text-white" : "text-slate-600"
                        }`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {isCombo && !isSelected && (
                <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-sm text-blue-800 font-medium">
        <Info className="w-5 h-5 text-blue-500 shrink-0" />
        <p>Pricing depends on your chosen term length. Longer terms = lower monthly rates.</p>
      </div>
    </motion.div>
  );
}
