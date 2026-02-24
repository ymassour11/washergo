"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle, FileText, Check, Lock, XCircle } from "lucide-react";

interface BookingInfo {
  id: string;
  status: string;
  packageType: string | null;
  termType: string | null;
  monthlyPriceCents: number | null;
  setupFeeCents: number | null;
  minimumTermMonths: number | null;
  contractSignedAt: string | null;
  contractSignerName: string | null;
  stripeSubscriptionId: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  customer: { name: string; email: string; phone: string } | null;
  deliverySlot: { date: string; windowLabel: string } | null;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatPackage(type: string): string {
  switch (type) {
    case "WASHER_DRYER": return "Full-Size Washer & Dryer";
    case "WASHER_ONLY": return "Full-Size Washer";
    case "DRYER_ONLY": return "Full-Size Electric Dryer";
    default: return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  }
}

function formatTerm(type: string): string {
  switch (type) {
    case "MONTH_TO_MONTH": return "Month-to-Month";
    case "SIX_MONTH": return "6-Month Term";
    case "TWELVE_MONTH": return "12-Month Term";
    default: return type.replace(/_/g, " ");
  }
}

function formatTermMonths(type: string): string {
  switch (type) {
    case "MONTH_TO_MONTH": return "2 months";
    case "SIX_MONTH": return "6 months";
    case "TWELVE_MONTH": return "12 months";
    default: return "as specified";
  }
}

function buildContract(booking: BookingInfo): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const customerName = booking.customer?.name || "_______________";
  const customerEmail = booking.customer?.email || "_______________";
  const customerPhone = booking.customer?.phone || "_______________";
  const equipment = booking.packageType ? formatPackage(booking.packageType) : "_______________";
  const term = booking.termType ? formatTerm(booking.termType) : "_______________";
  const minTerm = booking.termType ? formatTermMonths(booking.termType) : "_______________";
  const monthly = booking.monthlyPriceCents ? formatCents(booking.monthlyPriceCents) : "$__.__";
  const setupFee = booking.setupFeeCents != null ? (booking.setupFeeCents > 0 ? formatCents(booking.setupFeeCents) : "$0.00 (waived)") : "$__.__";
  const address = [
    booking.addressLine1,
    booking.addressLine2,
    [booking.city, booking.state, booking.zip].filter(Boolean).join(", "),
  ].filter(Boolean).join("\n    ");

  return `WASHER/DRYER RENTAL AGREEMENT
Date: ${today}

PARTIES:
  Company: GoWash LLC ("Company")
  Renter:  ${customerName} ("Renter")
  Email:   ${customerEmail}
  Phone:   ${customerPhone}

RENTAL PROPERTY:
    ${address || "_______________"}

EQUIPMENT:
    ${equipment}

TERM:
    ${term} (minimum ${minTerm})

PRICING:
    Monthly Rent:        ${monthly}/month
    Setup & Delivery Fee: ${setupFee} (one-time, non-refundable)

─────────────────────────────────────────────

1. EQUIPMENT
Company agrees to deliver, install, and rent to Renter the equipment listed above at the rental property address. Equipment remains the property of Company at all times.

2. TERM & RENEWAL
The initial rental term is ${minTerm}. After the minimum term, this Agreement automatically renews on a month-to-month basis until terminated by either party with 30 days written notice.

3. MONTHLY RENT
Renter agrees to pay ${monthly} per month. Payment is due on the same calendar day each month as the initial payment. Late payments may incur a fee of $10.00.

4. SETUP & DELIVERY FEE
A one-time, non-refundable setup and delivery fee of ${setupFee} is charged at the time of booking.

5. MAINTENANCE & REPAIRS
Company will maintain and repair the equipment at no additional charge for normal wear and tear. Renter must report any issues within 48 hours of discovery by contacting support@gowash.com.

6. RENTER RESPONSIBILITIES
Renter is responsible for:
  - Using equipment according to manufacturer instructions
  - Damage caused by misuse, negligence, or unauthorized modifications
  - Providing adequate water, electrical, and drainage connections
  - Keeping equipment in a clean, accessible location

7. ACCESS
Renter agrees to provide reasonable access for scheduled maintenance, repairs, and equipment retrieval with at least 24 hours notice from Company.

8. EARLY TERMINATION
If Renter terminates before the minimum term expires, an early termination fee equal to the remaining months of the minimum term will apply.

9. RETURN OF EQUIPMENT
Upon termination, Company will schedule pickup of equipment within 7 business days. Equipment must be returned in the same condition as delivered, minus normal wear and tear.

10. GOVERNING LAW
This Agreement is governed by the laws of the State of Texas. Any disputes shall be resolved in the courts of Harris County, Texas.`;
}

function DeliveryPaymentContent() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const canceled = searchParams.get("canceled");

  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [accepted, setAccepted] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Missing access token");
      setLoading(false);
      return;
    }

    fetch(`/api/pay/${bookingId}?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to load booking");
        }
        return res.json();
      })
      .then((data) => {
        setBooking(data.booking);
        // Pre-fill signer name with the customer's name
        if (data.booking.contractSignerName) {
          setSignerName(data.booking.contractSignerName);
          setAccepted(true);
        } else if (data.booking.customer?.name) {
          setSignerName(data.booking.customer.name);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [bookingId, token]);

  const handleSignAndPay = async () => {
    if (!token) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch(`/api/pay/${bookingId}/sign-and-pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signerName: signerName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong");
        setSubmitting(false);
        return;
      }

      window.location.href = data.sessionUrl;
    } catch {
      setSubmitError("Network error. Please try again.");
      setSubmitting(false);
    }
  };

  const isValid = accepted && signerName.trim().length >= 2;
  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-3">Access Error</h1>
          <p className="text-gray-600 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  if (!booking) return null;

  // Already paid
  if (booking.stripeSubscriptionId) {
    return (
      <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-2xl font-black uppercase tracking-tighter mb-3">Payment Already Collected</h1>
          <p className="text-gray-600 font-bold">This booking has already been paid.</p>
        </div>
      </div>
    );
  }

  const setupFee = booking.setupFeeCents ?? 0;
  const monthlyPrice = booking.monthlyPriceCents ?? 0;
  const dueToday = setupFee + monthlyPrice;
  const contractText = buildContract(booking);

  return (
    <div className="min-h-screen bg-[#F0F0F0] font-sans text-black selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="bg-white border-b-4 border-black px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter uppercase">
            Go<span className="text-blue-600">Wash</span>
          </h1>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Delivery Payment</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {canceled && (
          <div className="bg-red-50 border-3 border-red-300 p-4 text-sm font-bold text-red-700">
            Payment was canceled. You can try again below.
          </div>
        )}

        {/* Customer + Order Summary */}
        <div className="bg-white p-6 border-3 border-black" style={{ boxShadow: "4px 4px 0px 0px #000" }}>
          <h2 className="text-lg font-black uppercase tracking-tighter mb-4 border-b-2 border-black pb-2">
            Order Summary
          </h2>
          <div className="space-y-3 text-sm font-bold">
            {booking.customer && (
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase tracking-tight">Customer</span>
                <span>{booking.customer.name}</span>
              </div>
            )}
            {booking.packageType && (
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase tracking-tight">Package</span>
                <span>{formatPackage(booking.packageType)}</span>
              </div>
            )}
            {booking.termType && (
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase tracking-tight">Term</span>
                <span>{formatTerm(booking.termType)}</span>
              </div>
            )}
            {booking.addressLine1 && (
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase tracking-tight">Address</span>
                <span className="text-right">
                  {booking.addressLine1}
                  {booking.addressLine2 ? `, ${booking.addressLine2}` : ""}
                  <br />
                  {[booking.city, booking.state, booking.zip].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            {setupFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500 uppercase tracking-tight">Setup Fee</span>
                <span>{formatCents(setupFee)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500 uppercase tracking-tight">Monthly</span>
              <span>{monthlyPrice ? `${formatCents(monthlyPrice)}/mo` : "--"}</span>
            </div>
            <div className="flex justify-between pt-3 border-t-2 border-black text-lg">
              <span className="font-black uppercase">Due Today</span>
              <span className="font-black text-blue-600">{dueToday > 0 ? formatCents(dueToday) : "--"}</span>
            </div>
          </div>
        </div>

        {/* Contract */}
        <div className="bg-white border-3 border-black overflow-hidden" style={{ boxShadow: "4px 4px 0px 0px #000" }}>
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-xs uppercase tracking-widest">
              <FileText className="w-4 h-4 text-yellow-400" />
              Rental Agreement v1.0
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Scroll to read</span>
          </div>
          <div className="p-6 max-h-80 overflow-y-auto bg-white">
            <pre className="text-xs text-black whitespace-pre-wrap font-mono font-bold leading-relaxed">
              {contractText}
            </pre>
          </div>
        </div>

        {/* Accept checkbox */}
        <label
          className={`group flex items-start gap-4 p-6 border-3 border-black cursor-pointer transition-all duration-200 ${
            accepted
              ? "bg-yellow-300 translate-x-[-2px] translate-y-[-2px]"
              : "bg-white hover:translate-x-[-1px] hover:translate-y-[-1px]"
          }`}
          style={{ boxShadow: accepted ? "6px 6px 0px 0px #000" : "4px 4px 0px 0px #000" }}
        >
          <div
            className={`mt-0.5 w-7 h-7 border-3 border-black flex items-center justify-center shrink-0 transition-colors ${
              accepted ? "bg-black text-white" : "bg-white text-transparent"
            }`}
          >
            <Check className="w-4 h-4 stroke-[4]" />
          </div>
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="sr-only"
          />
          <span className="font-black text-base uppercase tracking-tighter pt-0.5">
            I have read and agree to the rental agreement
          </span>
        </label>

        {/* Signature */}
        <div className="bg-white p-6 border-3 border-black" style={{ boxShadow: "4px 4px 0px 0px #000" }}>
          <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-3">
            Full Name (Signature)
          </label>
          <input
            type="text"
            value={signerName}
            onChange={(e) => setSignerName(e.target.value)}
            placeholder="CUSTOMER FULL NAME"
            className="block w-full px-4 py-4 border-3 border-black bg-white text-black placeholder-gray-300 focus:outline-none focus:ring-4 focus:ring-blue-600/20 focus:border-blue-600 transition-all text-xl font-black uppercase tracking-tighter"
          />
          {signerName.length >= 2 && (
            <div className="mt-4 bg-green-200 p-3 border-2 border-black inline-flex items-center gap-2" style={{ boxShadow: "2px 2px 0px 0px #000" }}>
              <Check className="w-4 h-4 text-black stroke-[3]" />
              <p className="text-[10px] font-black uppercase tracking-tight">Signed on {formattedDate}</p>
            </div>
          )}
        </div>

        {/* Error */}
        {submitError && (
          <div className="bg-red-100 text-red-800 border-3 border-red-400 p-4 font-black uppercase tracking-tight text-sm">
            {submitError}
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSignAndPay}
          disabled={submitting || !isValid}
          className="w-full bg-blue-600 hover:bg-black disabled:bg-gray-300 text-white border-3 border-black py-5 font-black text-xl uppercase tracking-widest transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
          style={{ boxShadow: "6px 6px 0px 0px #000" }}
        >
          {submitting ? "Redirecting to payment..." : "Sign & Pay"}
          {!submitting && <Lock className="w-5 h-5 ml-2 stroke-[3] inline" />}
        </button>

        <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
          Secure payment powered by Stripe
        </p>
      </main>
    </div>
  );
}

export default function DeliveryPaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F0F0F0] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-3 border-black border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-black uppercase tracking-widest text-gray-500">Loading...</p>
          </div>
        </div>
      }
    >
      <DeliveryPaymentContent />
    </Suspense>
  );
}
