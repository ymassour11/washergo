"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";

interface Booking {
  id: string;
  status: string;
  packageType: string | null;
  currentStep: number;
  serviceZip: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  monthlyPriceCents: number | null;
  adminNotes: string | null;
  createdAt: string;
  customer: { name: string; email: string; phone: string } | null;
  deliverySlot: { date: string; windowLabel: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_CONFIG: Record<string, { bg: string; dot: string; text: string }> = {
  DRAFT:            { bg: "bg-stone-100",  dot: "bg-stone-400",  text: "text-stone-600" },
  QUALIFIED:        { bg: "bg-sky-50",     dot: "bg-sky-500",    text: "text-sky-700" },
  SCHEDULED:        { bg: "bg-blue-50",    dot: "bg-blue-500",   text: "text-blue-700" },
  PAID_SETUP:       { bg: "bg-violet-50",  dot: "bg-violet-500", text: "text-violet-700" },
  CONTRACT_SIGNED:  { bg: "bg-teal-50",    dot: "bg-teal-500",   text: "text-teal-700" },
  ACTIVE:           { bg: "bg-green-50",   dot: "bg-green-500",  text: "text-green-700" },
  PAST_DUE:         { bg: "bg-red-50",     dot: "bg-red-500",    text: "text-red-700" },
  CANCELED:         { bg: "bg-stone-50",   dot: "bg-stone-400",  text: "text-stone-500" },
  CLOSED:           { bg: "bg-stone-100",  dot: "bg-stone-400",  text: "text-stone-600" },
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${config.bg} px-2.5 py-1 text-xs font-bold ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default function AdminBookingsPage() {
  const { data: session } = useSession();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", String(page));

    const res = await fetch(`/api/admin/bookings?${params}`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setPagination(data.pagination || null);
    setLoading(false);
  }, [statusFilter, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const performAction = async (bookingId: string, action: string, notes?: string) => {
    setActionLoading(bookingId);
    await fetch(`/api/admin/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, notes }),
    });
    setActionLoading(null);
    fetchBookings();
  };

  const statuses = [
    "", "DRAFT", "QUALIFIED", "SCHEDULED", "PAID_SETUP",
    "CONTRACT_SIGNED", "ACTIVE", "PAST_DUE", "CANCELED", "CLOSED",
  ];

  return (
    <main className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h12A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[var(--text)]">Bookings</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-raised)] text-sm text-[var(--text-secondary)]">
              <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">
                {session?.user?.email?.charAt(0).toUpperCase()}
              </div>
              {session?.user?.email}
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="text-sm font-medium text-[var(--text-muted)] hover:text-red-600 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 pr-10 text-sm font-medium text-[var(--text-secondary)] focus-ring cursor-pointer"
            >
              <option value="">All Statuses</option>
              {statuses.filter(Boolean).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <svg className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
          {pagination && (
            <span className="text-sm text-[var(--text-muted)] flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
              {pagination.total} booking{pagination.total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="rounded-xl border border-[var(--border)] bg-white p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-20 h-4 rounded animate-shimmer" />
                  <div className="flex-1 h-4 rounded animate-shimmer" />
                  <div className="w-24 h-6 rounded-full animate-shimmer" />
                  <div className="w-16 h-4 rounded animate-shimmer" />
                </div>
              ))}
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-white py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <p className="text-[var(--text-secondary)] font-medium">No bookings found</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Bookings will appear here as customers complete the flow.</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block rounded-xl border border-[var(--border)] bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">ID</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Customer</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Package</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Delivery</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Created</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-[var(--surface-raised)]/50 transition-colors">
                      <td className="px-5 py-4">
                        <a href={`/admin/bookings/${b.id}`} className="text-xs font-mono bg-[var(--surface-raised)] px-2 py-0.5 rounded-md text-[var(--primary)] hover:underline">
                          {b.id.slice(0, 8)}
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        {b.customer ? (
                          <div>
                            <div className="font-semibold text-[var(--text)]">{b.customer.name}</div>
                            <div className="text-xs text-[var(--text-muted)] mt-0.5">{b.customer.phone}</div>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">--</span>
                        )}
                      </td>
                      <td className="px-5 py-4"><StatusBadge status={b.status} /></td>
                      <td className="px-5 py-4">
                        {b.packageType ? (
                          <div>
                            <span className="text-[var(--text)]">{b.packageType.replace(/_/g, " ")}</span>
                            {b.monthlyPriceCents && (
                              <span className="text-xs text-[var(--text-muted)] ml-1.5">{formatCents(b.monthlyPriceCents)}/mo</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">--</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs">
                        {b.deliverySlot ? (
                          <div>
                            <div className="text-[var(--text)] font-medium">{formatDate(b.deliverySlot.date)}</div>
                            <div className="text-[var(--text-muted)]">{b.deliverySlot.windowLabel}</div>
                          </div>
                        ) : (
                          <span className="text-[var(--text-muted)]">--</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-[var(--text-muted)]">{formatDate(b.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          {b.status === "CONTRACT_SIGNED" && (
                            <button
                              onClick={() => performAction(b.id, "mark_active")}
                              disabled={actionLoading === b.id}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Delivered
                            </button>
                          )}
                          {!["CANCELED", "CLOSED"].includes(b.status) && (
                            <button
                              onClick={() => { if (confirm("Cancel this booking?")) performAction(b.id, "cancel"); }}
                              disabled={actionLoading === b.id}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {bookings.map((b) => (
                <div key={b.id} className="rounded-xl border border-[var(--border)] bg-white p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      {b.customer ? (
                        <div className="font-semibold text-[var(--text)]">{b.customer.name}</div>
                      ) : (
                        <div className="text-[var(--text-muted)]">No customer yet</div>
                      )}
                      <a href={`/admin/bookings/${b.id}`} className="text-xs font-mono text-[var(--primary)] hover:underline">{b.id.slice(0, 8)}</a>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                    {b.packageType && (
                      <div>
                        <div className="text-xs text-[var(--text-muted)] mb-0.5">Package</div>
                        <div className="font-medium text-[var(--text-secondary)]">{b.packageType.replace(/_/g, " ")}</div>
                      </div>
                    )}
                    {b.monthlyPriceCents && (
                      <div>
                        <div className="text-xs text-[var(--text-muted)] mb-0.5">Price</div>
                        <div className="font-medium text-[var(--text-secondary)]">{formatCents(b.monthlyPriceCents)}/mo</div>
                      </div>
                    )}
                    {b.deliverySlot && (
                      <div className="col-span-2">
                        <div className="text-xs text-[var(--text-muted)] mb-0.5">Delivery</div>
                        <div className="font-medium text-[var(--text-secondary)]">
                          {formatDate(b.deliverySlot.date)} &middot; {b.deliverySlot.windowLabel}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-[var(--border)]">
                    {b.status === "CONTRACT_SIGNED" && (
                      <button
                        onClick={() => performAction(b.id, "mark_active")}
                        disabled={actionLoading === b.id}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {!["CANCELED", "CLOSED"].includes(b.status) && (
                      <button
                        onClick={() => { if (confirm("Cancel this booking?")) performAction(b.id, "cancel"); }}
                        disabled={actionLoading === b.id}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-all ${
                      page === pageNum
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
