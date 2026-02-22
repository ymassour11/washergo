"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Calendar as CalendarIcon, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";

interface Slot {
  id: string;
  date: string;
  windowLabel: string;
  available: boolean;
  remaining: number;
}

interface Props {
  booking: {
    customer?: { name: string; email: string; phone: string } | null;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    zip?: string;
    deliverySlotId?: string;
  };
  bookingId: string;
  onComplete: (addressData: Record<string, unknown>, deliverySlotId: string) => Promise<void>;
  saving: boolean;
  onBack: () => void;
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export default function StepDetails({ booking, onComplete, saving }: Props) {
  const [form, setForm] = useState({
    customerName: booking.customer?.name || "",
    customerEmail: booking.customer?.email || "",
    customerPhone: booking.customer?.phone || "",
    addressLine1: booking.addressLine1 || "",
    addressLine2: booking.addressLine2 || "",
    city: booking.city || "",
    state: booking.state || "",
    zip: booking.zip || "",
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState(booking.deliverySlotId || "");
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/delivery-slots")
      .then((r) => r.json())
      .then((data) => { 
        setSlots(data.slots || []); 
        setLoadingSlots(false); 
      })
      .catch(() => setLoadingSlots(false));
  }, []);

  useEffect(() => {
    if (slots.length > 0) {
      if (booking.deliverySlotId) {
        const slot = slots.find(s => s.id === booking.deliverySlotId);
        if (slot) {
          let dStr = slot.date;
          if (dStr.includes('T')) dStr = dStr.split('T')[0];
          const parts = dStr.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            const key = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            setSelectedDateKey(key);
            setCurrentMonth(new Date(y, m, 1));
          }
        }
      } else {
        const firstSlot = slots.find(s => s.available);
        if (firstSlot) {
          let dStr = firstSlot.date;
          if (dStr.includes('T')) dStr = dStr.split('T')[0];
          const parts = dStr.split('-');
          if (parts.length === 3) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            setCurrentMonth(new Date(y, m, 1));
          }
        }
      }
    }
  }, [slots, booking.deliverySlotId]);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isValid = form.customerName && form.customerEmail && form.customerPhone &&
    form.addressLine1 && form.city && form.state && form.zip && selectedSlot;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) return;
    setSubmitting(true);
    await onComplete(form, selectedSlot);
    setSubmitting(false);
  };

  const availableSlots = slots.filter(s => s.available);
  const normalizedGrouped: Record<string, Slot[]> = {};
  for (const slot of availableSlots) {
    let dStr = slot.date;
    if (dStr.includes('T')) dStr = dStr.split('T')[0];
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!normalizedGrouped[key]) normalizedGrouped[key] = [];
      normalizedGrouped[key].push(slot);
    } else {
      const d = new Date(slot.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!normalizedGrouped[key]) normalizedGrouped[key] = [];
      normalizedGrouped[key].push(slot);
    }
  }

  const isDisabled = !isValid || submitting || saving;

  const InputLabel = ({ children, optional }: { children: React.ReactNode, optional?: boolean }) => (
    <label className="block text-xs md:text-sm font-black text-black uppercase tracking-widest mb-2 md:mb-3">
      {children} {optional && <span className="text-gray-400 font-bold">(OPTIONAL)</span>}
    </label>
  );

  const inputClass = "block w-full px-4 py-4 border-3 border-black bg-white text-black font-bold uppercase tracking-tight placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-brutal-blue/20 focus:border-brutal-blue transition-all sm:text-sm";

  // Calendar generation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(i).padStart(2, '0');
    calendarDays.push(`${year}-${m}-${d}`);
  }

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="mb-8 md:mb-12">
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-black uppercase leading-[0.9] mb-4 md:mb-6">Your <span className="text-brutal-blue">Details</span></h2>
        <p className="text-black text-sm md:text-lg font-bold uppercase tracking-tight">Tell us where to bring the goods.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 md:space-y-12">
        {/* Contact Info */}
        <div className="bg-white p-6 md:p-8 border-3 md:border-4 border-black neo-brutal-shadow">
          <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-tighter mb-6 md:mb-8 border-b-2 md:border-b-4 border-black pb-2 md:pb-4 inline-block">Contact Info</h3>
          <div className="space-y-4 md:space-y-6">
            <div>
              <InputLabel>Full Name</InputLabel>
              <input type="text" required value={form.customerName} onChange={(e) => update("customerName", e.target.value)} placeholder="JOHN SMITH" className={inputClass} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <div>
                <InputLabel>Email</InputLabel>
                <input type="email" required value={form.customerEmail} onChange={(e) => update("customerEmail", e.target.value)} placeholder="JOHN@WASHGO.COM" className={inputClass} />
              </div>
              <div>
                <InputLabel>Phone</InputLabel>
                <input type="tel" required value={form.customerPhone} onChange={(e) => update("customerPhone", e.target.value)} placeholder="(713) 555-0100" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white p-6 md:p-8 border-3 md:border-4 border-black neo-brutal-shadow">
          <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-tighter mb-6 md:mb-8 border-b-2 md:border-b-4 border-black pb-2 md:pb-4 inline-block flex items-center gap-2 md:gap-3">
            <MapPin className="w-5 h-5 md:w-6 md:h-6 text-brutal-blue stroke-[3]" />
            Delivery Address
          </h3>
          <div className="space-y-4 md:space-y-6">
            <div>
              <InputLabel>Street Address</InputLabel>
              <input type="text" required value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} placeholder="123 MAIN STREET" className={inputClass} />
            </div>
            <div>
              <InputLabel optional>Apt / Unit</InputLabel>
              <input type="text" value={form.addressLine2} onChange={(e) => update("addressLine2", e.target.value)} placeholder="APT 4B" className={inputClass} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="col-span-2 sm:col-span-1">
                <InputLabel>City</InputLabel>
                <input type="text" required value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="HOUSTON" className={inputClass} />
              </div>
              <div>
                <InputLabel>State</InputLabel>
                <input type="text" required maxLength={2} value={form.state} onChange={(e) => update("state", e.target.value.toUpperCase())} placeholder="TX" className={inputClass} />
              </div>
              <div>
                <InputLabel>Zip</InputLabel>
                <input type="text" required maxLength={5} value={form.zip} onChange={(e) => update("zip", e.target.value.replace(/\D/g, ""))} placeholder="77001" className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Delivery Slot Calendar */}
        <div className="bg-white p-6 md:p-8 border-3 md:border-4 border-black neo-brutal-shadow">
          <h3 className="text-xl md:text-2xl font-black text-black uppercase tracking-tighter mb-6 md:mb-8 border-b-2 md:border-b-4 border-black pb-2 md:pb-4 inline-block flex items-center gap-2 md:gap-3">
            <CalendarIcon className="w-5 h-5 md:w-6 md:h-6 text-brutal-blue stroke-[3]" />
            Delivery Window
          </h3>

          {loadingSlots ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 md:h-20 bg-gray-100 border-2 border-black animate-pulse" />
              ))}
            </div>
          ) : Object.keys(normalizedGrouped).length === 0 ? (
            <div className="py-12 md:py-16 text-center bg-gray-100 border-2 md:border-4 border-black">
              <p className="text-base md:text-lg font-black uppercase">No slots available</p>
              <p className="text-[10px] md:text-xs font-bold uppercase mt-2">Check back later.</p>
            </div>
          ) : (
            <div className="relative min-h-[350px] md:min-h-[400px] flex flex-col overflow-hidden">
              <AnimatePresence mode="wait">
                {!selectedDateKey ? (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1"
                  >
                    {/* Header: Month & Year */}
                    <div className="flex items-center justify-between mb-6 md:mb-8">
                      <button type="button" onClick={prevMonth} className="w-10 h-10 md:w-12 md:h-12 border-2 md:border-3 border-black flex items-center justify-center bg-white hover:bg-brutal-yellow transition-colors neo-brutal-shadow"><ChevronLeft className="w-5 h-5 md:w-6 md:h-6 stroke-[3]"/></button>
                      <h4 className="font-black text-lg md:text-2xl uppercase tracking-tighter text-black">
                        {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      </h4>
                      <button type="button" onClick={nextMonth} className="w-10 h-10 md:w-12 md:h-12 border-2 md:border-3 border-black flex items-center justify-center bg-white hover:bg-brutal-yellow transition-colors neo-brutal-shadow"><ChevronRight className="w-5 h-5 md:w-6 md:h-6 stroke-[3]"/></button>
                    </div>
                    
                    {/* Days of week */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 md:mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-center text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{d}</div>
                      ))}
                    </div>
                    
                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                      {calendarDays.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} className="h-10 md:h-16" />;
                        const hasSlots = !!normalizedGrouped[day];
                        
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const [dy, dm, dd] = day.split('-');
                        const dayDate = new Date(parseInt(dy), parseInt(dm)-1, parseInt(dd));
                        const isPast = dayDate < today;

                        return (
                          <button
                            key={day}
                            type="button"
                            disabled={!hasSlots || isPast}
                            onClick={() => setSelectedDateKey(day)}
                            className={`group relative h-10 md:h-16 border-2 md:border-3 border-black flex items-center justify-center text-xs md:text-sm font-black transition-all ${
                              hasSlots && !isPast
                                ? 'bg-white text-black hover:bg-brutal-blue hover:text-white hover:translate-x-[-2px] hover:translate-y-[-2px] neo-brutal-shadow cursor-pointer' 
                                : 'text-gray-200 cursor-not-allowed bg-gray-50'
                            }`}
                          >
                            {parseInt(dd, 10)}
                            {hasSlots && !isPast && (
                              <div className="absolute top-0.5 right-0.5 md:top-1 md:right-1 w-1.5 h-1.5 md:w-2 md:h-2 bg-brutal-yellow border border-black" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="times"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1"
                  >
                    <button 
                      type="button" 
                      onClick={() => setSelectedDateKey(null)}
                      className="text-[10px] font-black uppercase tracking-widest text-brutal-blue flex items-center gap-2 mb-6 md:mb-8 bg-white border-2 border-black px-3 py-1.5 md:px-4 md:py-2 neo-brutal-shadow hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                    >
                      <ChevronLeft className="w-3 h-3 md:w-4 md:h-4 stroke-[3]" /> Back to calendar
                    </button>
                    
                    <h4 className="font-black text-xl md:text-3xl uppercase tracking-tighter text-black mb-6 md:mb-8 border-b-2 md:border-b-4 border-black pb-2 md:pb-4">
                      {(() => {
                        const [dy, dm, dd] = selectedDateKey.split('-');
                        return new Date(parseInt(dy), parseInt(dm)-1, parseInt(dd)).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
                      })()}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                      {normalizedGrouped[selectedDateKey].map((slot) => (
                        <button
                          type="button"
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot.id)}
                          className={`p-4 md:p-6 border-3 md:border-4 border-black text-left transition-all duration-200 ${
                            selectedSlot === slot.id
                              ? "bg-brutal-yellow neo-brutal-shadow-lg translate-x-[-2px] translate-y-[-2px] md:translate-x-[-4px] md:translate-y-[-4px]"
                              : "bg-white hover:bg-gray-50 neo-brutal-shadow"
                          }`}
                        >
                          <div className="font-black text-lg md:text-xl uppercase tracking-tighter">{slot.windowLabel}</div>
                          {slot.remaining <= 2 && (
                            <div className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mt-1.5 md:mt-2 px-1.5 py-0.5 md:px-2 md:py-1 border-2 border-black inline-block ${
                              selectedSlot === slot.id ? "bg-black text-white" : "bg-brutal-pink text-black"
                            }`}>
                              Only {slot.remaining} left
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="pt-4 md:pt-8">
          <button
            type="submit"
            disabled={isDisabled}
            className="w-full bg-brutal-blue hover:bg-black disabled:bg-gray-300 text-white border-3 md:border-4 border-black py-4 md:py-6 font-black text-lg md:text-2xl uppercase tracking-widest transition-all neo-brutal-shadow-lg hover:translate-x-[-2px] hover:translate-y-[-2px] md:hover:translate-x-[-4px] md:hover:translate-y-[-4px] md:hover:shadow-[12px_12px_0px_0px_#000]"
          >
            {submitting || saving ? "Saving..." : "Confirm & Continue"}
            {!submitting && !saving && <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 stroke-[3]" />}
          </button>
          <div className="mt-6 md:mt-8 bg-brutal-green p-3 md:p-4 border-2 md:border-3 border-black neo-brutal-shadow flex items-center justify-center gap-2 md:gap-3">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-black stroke-[3]" />
            <p className="text-[10px] md:text-xs font-black uppercase tracking-tight">Your slot is held for 15 minutes</p>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
