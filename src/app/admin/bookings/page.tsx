"use client";

import { useState, useEffect, useCallback } from "react";
import { StatusBadge } from "@/components/admin/status-badge";

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
  payAtDelivery: boolean;
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

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date}, ${time}`;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search) params.set("search", search);
    params.set("page", String(page));

    const res = await fetch(`/api/admin/bookings?${params}`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setPagination(data.pagination || null);
    setLoading(false);
  }, [statusFilter, search, page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Clear selection when filters or page change
  useEffect(() => {
    setSelected(new Set());
  }, [statusFilter, search, page]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === bookings.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(bookings.map((b) => b.id)));
    }
  };

  const performAction = async (bookingId: string, action: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Action failed");
      }
    } catch {
      alert("Network error");
    }
    setActionLoading(null);
    fetchBookings();
  };

  const deleteBooking = async (bookingId: string) => {
    setActionLoading(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Network error");
    }
    setActionLoading(null);
    fetchBookings();
  };

  const bulkCancel = async () => {
    const ids = Array.from(selected);
    const cancelable = bookings.filter((b) => ids.includes(b.id) && !["CANCELED", "CLOSED"].includes(b.status));
    if (cancelable.length === 0) {
      alert("None of the selected bookings can be canceled (already canceled or closed).");
      return;
    }
    if (!confirm(`Cancel ${cancelable.length} booking${cancelable.length !== 1 ? "s" : ""}? This will release their delivery slots.`)) return;

    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/bookings/bulk-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: cancelable.map((b) => b.id) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Bulk cancel failed");
      } else {
        const data = await res.json();
        const msg = [`Canceled: ${data.canceled.length}`];
        if (data.skipped.length > 0) msg.push(`Skipped: ${data.skipped.length}`);
        alert(msg.join("\n"));
      }
    } catch {
      alert("Network error");
    }
    setBulkLoading(false);
    setSelected(new Set());
    fetchBookings();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    const deletable = bookings.filter((b) => ids.includes(b.id) && ["CANCELED", "CLOSED"].includes(b.status));
    if (deletable.length === 0) {
      alert("None of the selected bookings can be deleted. Only CANCELED or CLOSED bookings can be deleted.");
      return;
    }
    if (!confirm(`Permanently delete ${deletable.length} booking${deletable.length !== 1 ? "s" : ""}? This cannot be undone.`)) return;

    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/bookings/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: deletable.map((b) => b.id) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Bulk delete failed");
      } else {
        const data = await res.json();
        const msg = [`Deleted: ${data.deleted.length}`];
        if (data.skipped.length > 0) msg.push(`Skipped: ${data.skipped.length}`);
        alert(msg.join("\n"));
      }
    } catch {
      alert("Network error");
    }
    setBulkLoading(false);
    setSelected(new Set());
    fetchBookings();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const statuses = [
    "", "DRAFT", "QUALIFIED", "SCHEDULED", "PAID_SETUP",
    "CONTRACT_SIGNED", "ACTIVE", "PAST_DUE", "CANCELED", "CLOSED",
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Bookings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Manage customer bookings and delivery status</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
          <svg className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-xl border border-[var(--border)] bg-white pl-10 pr-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus-ring"
          />
        </form>
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
          <span className="text-sm text-[var(--text-muted)]">
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
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {search || statusFilter ? "Try adjusting your filters." : "Bookings will appear here as customers complete the flow."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block rounded-xl border border-[var(--border)] bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--surface-raised)] border-b border-[var(--border)]">
                  <th className="w-12 px-3 py-3.5">
                    <input
                      type="checkbox"
                      checked={bookings.length > 0 && selected.size === bookings.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">ID</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Customer</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Payment</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Package</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Delivery</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Created</th>
                  <th className="text-right px-5 py-3.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {bookings.map((b) => (
                  <tr key={b.id} className={`hover:bg-[var(--surface-raised)]/50 transition-colors ${selected.has(b.id) ? "bg-[var(--primary)]/5" : ""}`}>
                    <td className="w-12 px-3 py-4">
                      <input
                        type="checkbox"
                        checked={selected.has(b.id)}
                        onChange={() => toggleSelect(b.id)}
                        className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                      />
                    </td>
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
                      {b.payAtDelivery ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v7.875" /></svg>
                          At Delivery
                        </span>
                      ) : ["PAID_SETUP", "CONTRACT_SIGNED", "ACTIVE", "PAST_DUE"].includes(b.status) ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
                          Paid Online
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">--</span>
                      )}
                    </td>
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
                    <td className="px-5 py-4 text-xs text-[var(--text-muted)]">{formatDateTime(b.createdAt)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {["PAID_SETUP", "CONTRACT_SIGNED"].includes(b.status) && (
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
                        {["CANCELED", "CLOSED"].includes(b.status) && (
                          <button
                            onClick={() => { if (confirm("Permanently delete this booking? This cannot be undone.")) deleteBooking(b.id); }}
                            disabled={actionLoading === b.id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Delete
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
              <div key={b.id} className={`rounded-xl border bg-white p-5 ${selected.has(b.id) ? "border-[var(--primary)] ring-1 ring-[var(--primary)]/20" : "border-[var(--border)]"}`}>
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    checked={selected.has(b.id)}
                    onChange={() => toggleSelect(b.id)}
                    className="w-4 h-4 mt-1 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
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
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm mb-4 pl-7">
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-0.5">Payment</div>
                    {b.payAtDelivery ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700">At Delivery</span>
                    ) : ["PAID_SETUP", "CONTRACT_SIGNED", "ACTIVE", "PAST_DUE"].includes(b.status) ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700">Paid Online</span>
                    ) : (
                      <span className="text-xs text-[var(--text-muted)]">--</span>
                    )}
                  </div>
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

                <div className="flex gap-2 pt-3 border-t border-[var(--border)] pl-7">
                  {["PAID_SETUP", "CONTRACT_SIGNED"].includes(b.status) && (
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
                  {["CANCELED", "CLOSED"].includes(b.status) && (
                    <button
                      onClick={() => { if (confirm("Permanently delete this booking? This cannot be undone.")) deleteBooking(b.id); }}
                      disabled={actionLoading === b.id}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      Delete
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

      {/* Floating bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-[calc(50%+128px)] z-40">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white px-5 py-3 shadow-xl shadow-black/10">
            <span className="text-sm font-semibold text-[var(--text)]">
              {selected.size} selected
            </span>
            <div className="w-px h-6 bg-[var(--border)]" />
            <button
              onClick={bulkCancel}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Bulk Cancel
            </button>
            <button
              onClick={bulkDelete}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Bulk Delete
            </button>
            <button
              onClick={() => setSelected(new Set())}
              disabled={bulkLoading}
              className="rounded-xl px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-raised)] disabled:opacity-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
