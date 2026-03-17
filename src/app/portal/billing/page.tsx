"use client";

import { useState, useEffect } from "react";

interface PaymentRecord {
  id: string;
  amountCents: number;
  currency: string;
  status: string;
  description: string | null;
  invoicePdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface BillingBooking {
  id: string;
  status: string;
  packageType: string | null;
  termType: string | null;
  monthlyPriceCents: number | null;
  canManageBilling: boolean;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isStripeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith("stripe.com");
  } catch {
    return false;
  }
}

export default function PortalBillingPage() {
  const [booking, setBooking] = useState<BillingBooking | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  useEffect(() => {
    fetch("/api/portal/billing")
      .then((r) => r.json())
      .then((data) => {
        setBooking(data.booking);
        setPayments(data.payments || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const openStripePortal = async () => {
    setPortalLoading(true);
    setPortalError("");
    try {
      const res = await fetch("/api/portal/billing/stripe-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setPortalError(data.error || "Failed to open billing portal");
      }
    } catch {
      setPortalError("Network error. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-3xl space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="rounded-xl border-2 border-black/5 bg-white p-6">
              <div className="h-4 w-32 rounded bg-black/5 animate-pulse mb-4" />
              <div className="h-4 w-full rounded bg-black/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-black tracking-tight">Billing</h1>
        <p className="text-sm text-black/40 mt-1 font-medium">Manage your subscription and view payment history</p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Subscription Summary */}
        {booking && (
          <section className="rounded-xl border-2 border-black/5 bg-white p-6">
            <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-5">Subscription</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-5">
              <div>
                <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1.5">Package</div>
                <div className="font-bold text-black">{booking.packageType ? formatLabel(booking.packageType) : "--"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1.5">Term</div>
                <div className="font-bold text-black">{booking.termType ? formatLabel(booking.termType) : "--"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1.5">Monthly Rate</div>
                <div className="font-bold text-[#0055FF]">
                  {booking.monthlyPriceCents ? formatCents(booking.monthlyPriceCents) : "--"}<span className="text-sm text-black/30">/mo</span>
                </div>
              </div>
            </div>
            {portalError && (
              <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 mb-3">
                {portalError}
              </div>
            )}
            {booking.canManageBilling && (
              <button
                onClick={openStripePortal}
                disabled={portalLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0055FF] px-5 py-3 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#0044CC] disabled:opacity-50 transition-colors shadow-lg shadow-[#0055FF]/20"
              >
                {portalLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Opening...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Manage Payment Method
                  </>
                )}
              </button>
            )}
          </section>
        )}

        {/* Past Due Warning */}
        {booking?.status === "PAST_DUE" && (
          <section className="rounded-xl border-2 border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <p className="text-sm font-bold text-red-700">Payment Past Due</p>
                <p className="text-sm text-red-600 mt-1 font-medium">
                  Your account has an outstanding balance. Please update your payment method to avoid service interruption.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Payment History */}
        <section className="rounded-xl border-2 border-black/5 bg-white p-6">
          <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-5">Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-black/30 text-sm font-medium">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-black/5">
                    <th className="text-left py-3 pr-4 text-[10px] font-bold text-black/30 uppercase tracking-widest">Date</th>
                    <th className="text-left py-3 pr-4 text-[10px] font-bold text-black/30 uppercase tracking-widest">Amount</th>
                    <th className="text-left py-3 pr-4 text-[10px] font-bold text-black/30 uppercase tracking-widest">Status</th>
                    <th className="text-left py-3 pr-4 text-[10px] font-bold text-black/30 uppercase tracking-widest">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3.5 pr-4 text-black font-medium">{formatDate(p.paidAt || p.createdAt)}</td>
                      <td className="py-3.5 pr-4 font-bold text-black">{formatCents(p.amountCents)}</td>
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
                          p.status === "paid" ? "bg-green-50 text-green-700"
                            : p.status === "failed" ? "bg-red-50 text-red-700"
                            : "bg-black/5 text-black/50"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center gap-3">
                          {p.invoicePdfUrl && isStripeUrl(p.invoicePdfUrl) && (
                            <a href={p.invoicePdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#0055FF] hover:underline uppercase tracking-wider">
                              PDF
                            </a>
                          )}
                          {p.hostedInvoiceUrl && isStripeUrl(p.hostedInvoiceUrl) && (
                            <a href={p.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-black/30 hover:text-black hover:underline uppercase tracking-wider">
                              View
                            </a>
                          )}
                          {!p.invoicePdfUrl && !p.hostedInvoiceUrl && (
                            <span className="text-xs text-black/20 font-medium">--</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
