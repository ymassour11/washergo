"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { StatusBadge } from "@/components/admin/status-badge";

interface BookingData {
  id: string;
  status: string;
  packageType: string | null;
  termType: string | null;
  monthlyPriceCents: number | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  contractSignedAt: string | null;
  createdAt: string;
  customer: { name: string; email: string; phone: string } | null;
  deliverySlot: { date: string; windowLabel: string } | null;
  assignments: { id: string; installedAt: string | null; asset: { type: string; model: string; serialNumber: string } }[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function PortalDashboard() {
  const { data: session } = useSession();
  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/booking")
      .then((r) => r.json())
      .then((data) => setBooking(data.booking))
      .finally(() => setLoading(false));
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl space-y-6">
          <div className="h-8 w-48 rounded bg-black/5 animate-pulse mb-2" />
          <div className="h-4 w-64 rounded bg-black/5 animate-pulse mb-8" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border-2 border-black/5 bg-white p-6">
              <div className="h-4 w-32 rounded bg-black/5 animate-pulse mb-4" />
              <div className="h-4 w-full rounded bg-black/5 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-black/5 mb-4">
            <svg className="w-8 h-8 text-black/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0l-3-3m3 3l3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-black font-bold">No active booking found</p>
          <p className="text-sm text-black/40 mt-1 font-medium">Contact support if you believe this is an error.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-black tracking-tight">
          Hey, {firstName}
        </h1>
        <p className="text-sm text-black/40 mt-1 font-medium">Here&apos;s your rental overview</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Status + Plan Summary */}
        <section className="rounded-xl border-2 border-black/5 bg-white p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0055FF]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest">Your Rental</h2>
              <StatusBadge status={booking.status} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1.5">Package</div>
                <div className="font-bold text-black text-lg">{booking.packageType ? formatLabel(booking.packageType) : "--"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1.5">Term</div>
                <div className="font-bold text-black text-lg">{booking.termType ? formatLabel(booking.termType) : "--"}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1.5">Monthly Rate</div>
                <div className="font-bold text-[#0055FF] text-lg">
                  {booking.monthlyPriceCents ? formatCents(booking.monthlyPriceCents) : "--"}<span className="text-sm text-black/30">/mo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Address */}
        {booking.addressLine1 && (
          <section className="rounded-xl border-2 border-black/5 bg-white p-6">
            <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">Delivery Address</h2>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#0055FF]/8 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-[#0055FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div>
                <p className="text-black font-bold">
                  {booking.addressLine1}{booking.addressLine2 ? `, ${booking.addressLine2}` : ""}
                </p>
                <p className="text-black/50 text-sm font-medium">
                  {booking.city}, {booking.state} {booking.zip}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Assigned Equipment */}
        {booking.assignments.length > 0 && (
          <section className="rounded-xl border-2 border-black/5 bg-white p-6">
            <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">Your Equipment</h2>
            <div className="space-y-3">
              {booking.assignments.map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3.5 rounded-lg bg-[#f5f5f0] border border-black/5">
                  <div className="w-10 h-10 rounded-lg bg-[#0055FF]/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-[#0055FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-bold text-black text-sm">{a.asset.type} &mdash; {a.asset.model}</div>
                    <div className="text-xs text-black/30 font-medium">S/N: {a.asset.serialNumber}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a
            href="/portal/billing"
            className="rounded-xl border-2 border-black/5 bg-white p-5 hover:border-[#0055FF]/30 hover:shadow-lg hover:shadow-[#0055FF]/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0 group-hover:bg-green-500/15 transition-colors">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-black">Billing</div>
                <div className="text-xs text-black/40 font-medium">View invoices & manage payment</div>
              </div>
            </div>
          </a>
          <a
            href="/portal/service-requests"
            className="rounded-xl border-2 border-black/5 bg-white p-5 hover:border-[#0055FF]/30 hover:shadow-lg hover:shadow-[#0055FF]/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/15 transition-colors">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 3.03c-.908.51-1.96-.316-1.672-1.313l.828-2.879a1.125 1.125 0 00-.394-1.211L.882 9.54c-.787-.6-.378-1.81.588-1.81h3.461a1.125 1.125 0 001.07-.767l1.07-3.292c.324-.998 1.742-.998 2.066 0l1.07 3.292a1.125 1.125 0 001.07.767h3.461c.966 0 1.375 1.21.588 1.81l-2.8 2.034a1.125 1.125 0 00-.394 1.211l.828 2.879c.288.997-.764 1.823-1.672 1.313l-5.384-3.03z" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-black">Service Requests</div>
                <div className="text-xs text-black/40 font-medium">Maintenance, moves & more</div>
              </div>
            </div>
          </a>
        </section>
      </div>
    </div>
  );
}
