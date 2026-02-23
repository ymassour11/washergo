"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/admin/status-badge";

interface PaymentRecord {
  id: string;
  stripeInvoiceId: string | null;
  amountCents: number;
  currency: string;
  status: string;
  invoicePdfUrl: string | null;
  hostedInvoiceUrl: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface BookingDetail {
  id: string;
  status: string;
  packageType: string | null;
  termType: string | null;
  currentStep: number;
  serviceZip: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  monthlyPriceCents: number | null;
  setupFeeCents: number | null;
  payAtDelivery: boolean;
  adminNotes: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: string;
  customer: { name: string; email: string; phone: string } | null;
  deliverySlot: { date: string; windowLabel: string } | null;
  paymentRecords: PaymentRecord[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isStripeUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname.endsWith("stripe.com");
  } catch {
    return false;
  }
}

export default function AdminBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const fetchBooking = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`);
      if (!res.ok) {
        setBooking(null);
        return;
      }
      const data = await res.json();
      setBooking(data.booking);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchBooking();
  }, [fetchBooking]);

  const performAction = async (action: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Action failed");
        return;
      }
      await fetchBooking();
    } catch {
      setActionError("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const deleteBooking = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setActionError(data.error || "Delete failed");
        return;
      }
      router.push("/admin/bookings");
    } catch {
      setActionError("Network error");
    } finally {
      setActionLoading(false);
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update_notes", notes: notesValue }),
      });
      setEditingNotes(false);
      await fetchBooking();
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-4xl space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-6">
              <div className="h-4 w-32 rounded animate-shimmer mb-4" />
              <div className="h-4 w-full rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <p className="text-[var(--text-secondary)] font-medium">Booking not found</p>
          <button onClick={() => router.push("/admin/bookings")} className="mt-4 text-sm text-[var(--primary)] hover:underline">
            Back to bookings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Breadcrumb + Status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/bookings")}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Bookings
          </button>
          <span className="text-[var(--text-muted)]">/</span>
          <code className="text-sm font-mono text-[var(--text-secondary)]">{booking.id.slice(0, 8)}</code>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Customer Info */}
        <section className="rounded-xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Customer</h2>
          {booking.customer ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">Name</div>
                <div className="font-medium text-[var(--text)]">{booking.customer.name}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">Email</div>
                <div className="font-medium text-[var(--text)]">{booking.customer.email}</div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)] mb-1">Phone</div>
                <div className="font-medium text-[var(--text)]">{booking.customer.phone}</div>
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-muted)]">No customer info yet</p>
          )}
        </section>

        {/* Booking Details */}
        <section className="rounded-xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Booking Details</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Package</div>
              <div className="font-medium text-[var(--text)]">{booking.packageType?.replace(/_/g, " ") || "--"}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Term</div>
              <div className="font-medium text-[var(--text)]">{booking.termType?.replace(/_/g, " ") || "--"}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Monthly</div>
              <div className="font-medium text-[var(--text)]">
                {booking.monthlyPriceCents ? formatCents(booking.monthlyPriceCents) : "--"}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Setup Fee</div>
              <div className="font-medium text-[var(--text)]">
                {booking.setupFeeCents != null ? formatCents(booking.setupFeeCents) : "--"}
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Payment Method</div>
              {booking.payAtDelivery ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v7.875" /></svg>
                  Pay at Delivery
                </span>
              ) : ["PAID_SETUP", "CONTRACT_SIGNED", "ACTIVE", "PAST_DUE"].includes(booking.status) ? (
                <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                  Paid Online
                </span>
              ) : (
                <span className="font-medium text-[var(--text-muted)]">--</span>
              )}
            </div>
            {booking.deliverySlot && (
              <div className="col-span-2">
                <div className="text-xs text-[var(--text-muted)] mb-1">Delivery</div>
                <div className="font-medium text-[var(--text)]">
                  {formatDate(booking.deliverySlot.date)} &middot; {booking.deliverySlot.windowLabel}
                </div>
              </div>
            )}
            {booking.addressLine1 && (
              <div className="col-span-2">
                <div className="text-xs text-[var(--text-muted)] mb-1">Address</div>
                <div className="font-medium text-[var(--text)]">
                  {booking.addressLine1}{booking.addressLine2 ? `, ${booking.addressLine2}` : ""}
                  <br />
                  {booking.city}, {booking.state} {booking.zip}
                </div>
              </div>
            )}
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Created</div>
              <div className="font-medium text-[var(--text)]">{formatDate(booking.createdAt)}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Step</div>
              <div className="font-medium text-[var(--text)]">{booking.currentStep} / 8</div>
            </div>
          </div>
        </section>

        {/* Payment History */}
        <section className="rounded-xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Payment History</h2>
          {booking.paymentRecords.length === 0 ? (
            <p className="text-[var(--text-muted)] text-sm">No payments recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Date</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Amount</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                    <th className="text-left py-2 pr-4 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {booking.paymentRecords.map((pr) => (
                    <tr key={pr.id}>
                      <td className="py-3 pr-4 text-[var(--text)]">
                        {pr.paidAt ? formatDate(pr.paidAt) : formatDate(pr.createdAt)}
                      </td>
                      <td className="py-3 pr-4 font-medium text-[var(--text)]">{formatCents(pr.amountCents)}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold ${
                          pr.status === "paid" ? "bg-green-50 text-green-700"
                            : pr.status === "failed" ? "bg-red-50 text-red-700"
                            : "bg-stone-100 text-stone-600"
                        }`}>
                          {pr.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          {pr.invoicePdfUrl && isStripeUrl(pr.invoicePdfUrl) && (
                            <a href={pr.invoicePdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--primary)] hover:underline">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                              PDF
                            </a>
                          )}
                          {pr.hostedInvoiceUrl && isStripeUrl(pr.hostedInvoiceUrl) && (
                            <a href={pr.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text)] hover:underline">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                              </svg>
                              View
                            </a>
                          )}
                          {!pr.invoicePdfUrl && !pr.hostedInvoiceUrl && (
                            <span className="text-xs text-[var(--text-muted)]">--</span>
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

        {/* Stripe IDs */}
        {(booking.stripeCustomerId || booking.stripeSubscriptionId) && (
          <section className="rounded-xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Stripe</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {booking.stripeCustomerId && (
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Customer ID</div>
                  <code className="text-xs font-mono bg-[var(--surface-raised)] px-2 py-0.5 rounded-md text-[var(--text-secondary)]">
                    {booking.stripeCustomerId}
                  </code>
                </div>
              )}
              {booking.stripeSubscriptionId && (
                <div>
                  <div className="text-xs text-[var(--text-muted)] mb-1">Subscription ID</div>
                  <code className="text-xs font-mono bg-[var(--surface-raised)] px-2 py-0.5 rounded-md text-[var(--text-secondary)]">
                    {booking.stripeSubscriptionId}
                  </code>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Admin Notes (editable) */}
        <section className="rounded-xl border border-[var(--border)] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Admin Notes</h2>
            {!editingNotes && (
              <button
                onClick={() => { setNotesValue(booking.adminNotes || ""); setEditingNotes(true); }}
                className="text-xs font-medium text-[var(--primary)] hover:underline"
              >
                {booking.adminNotes ? "Edit" : "Add notes"}
              </button>
            )}
          </div>
          {editingNotes ? (
            <div>
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus-ring resize-none"
                placeholder="Add internal notes about this booking..."
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={saveNotes}
                  disabled={savingNotes}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
                >
                  {savingNotes ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingNotes(false)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : booking.adminNotes ? (
            <p className="text-sm text-[var(--text)] whitespace-pre-wrap">{booking.adminNotes}</p>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No notes yet.</p>
          )}
        </section>

        {/* Actions */}
        {actionError && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {actionError}
          </div>
        )}
        <section className="flex flex-wrap gap-3">
          {["PAID_SETUP", "CONTRACT_SIGNED"].includes(booking.status) && (
            <button
              onClick={() => performAction("mark_active")}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Mark as Delivered
            </button>
          )}
          {["ACTIVE", "PAST_DUE"].includes(booking.status) && (
            <button
              onClick={() => performAction("close")}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] disabled:opacity-50 transition-colors"
            >
              Close Booking
            </button>
          )}
          {!["CANCELED", "CLOSED"].includes(booking.status) && (
            <button
              onClick={() => { if (confirm("Cancel this booking? This cannot be undone.")) performAction("cancel"); }}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel Booking
            </button>
          )}
          {["CANCELED", "CLOSED"].includes(booking.status) && (
            <button
              onClick={() => { if (confirm("Permanently delete this booking? This cannot be undone.")) deleteBooking(); }}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete Booking
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
