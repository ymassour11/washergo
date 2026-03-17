"use client";

import { useState, useEffect, useCallback } from "react";

interface ServiceRequest {
  id: string;
  category: string;
  status: string;
  priority: string;
  title: string;
  description: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  booking: {
    id: string;
    status: string;
    customer: { name: string; email: string; phone: string } | null;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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

function formatLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 border-amber-200",
  RESOLVED: "bg-green-50 text-green-700 border-green-200",
  CLOSED: "bg-stone-100 text-stone-600 border-stone-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-stone-100 text-stone-600",
  MEDIUM: "bg-blue-50 text-blue-700",
  HIGH: "bg-orange-50 text-orange-700",
  URGENT: "bg-red-50 text-red-700",
};

const CATEGORY_ICONS: Record<string, string> = {
  MAINTENANCE: "M11.42 15.17l-4.655-.84a.75.75 0 01-.543-.427L4.76 10.2a.75.75 0 01.19-.866l3.514-3.197a.75.75 0 01.753-.151l4.47 1.613a.75.75 0 01.479.465l1.29 4.01a.75.75 0 01-.16.786l-3.373 3.285a.75.75 0 01-.503.198z",
  BILLING: "M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z",
  MOVE_REQUEST: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H21M3.375 14.25V3.375c0-.621.504-1.125 1.125-1.125h9.75c.621 0 1.125.504 1.125 1.125v7.875",
  CANCELLATION: "M6 18L18 6M6 6l12 12",
  OTHER: "M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z",
};

export default function AdminServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (search) params.set("search", search);
    params.set("page", String(page));

    const res = await fetch(`/api/admin/service-requests?${params}`);
    const data = await res.json();
    setRequests(data.requests || []);
    setPagination(data.pagination || null);
    setLoading(false);
  }, [statusFilter, categoryFilter, priorityFilter, search, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateRequest = async (id: string, body: Record<string, string>) => {
    setActionLoading(id);
    await fetch(`/api/admin/service-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await fetchRequests();
    setActionLoading(null);
  };

  const resolveRequest = async (id: string) => {
    setActionLoading(id);
    await fetch(`/api/admin/service-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED", resolution: resolutionText }),
    });
    setResolutionText("");
    setExpandedId(null);
    await fetchRequests();
    setActionLoading(null);
  };

  const openCount = requests.filter((r) => r.status === "OPEN").length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[var(--text)]">Service Requests</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Customer support tickets and maintenance requests
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput); setPage(1); }}
          className="relative flex-1 min-w-[200px] max-w-sm"
        >
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            placeholder="Search by title or customer..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-white text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus-ring"
          />
        </form>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--text)] focus-ring"
        >
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--text)] focus-ring"
        >
          <option value="">All Categories</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="BILLING">Billing</option>
          <option value="MOVE_REQUEST">Move Request</option>
          <option value="CANCELLATION">Cancellation</option>
          <option value="OTHER">Other</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-[var(--text)] focus-ring"
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        {pagination && (
          <span className="text-sm text-[var(--text-muted)] ml-auto">
            {pagination.total} request{pagination.total !== 1 ? "s" : ""}
            {openCount > 0 && (
              <span className="ml-1 inline-flex items-center rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-bold">
                {openCount} open
              </span>
            )}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-center gap-4">
                <div className="h-4 w-48 rounded animate-shimmer" />
                <div className="h-4 w-20 rounded animate-shimmer" />
                <div className="ml-auto h-4 w-24 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-12 h-12 text-[var(--text-muted)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
          <p className="text-[var(--text-muted)] font-medium">No service requests found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Requests submitted by customers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const isExpanded = expandedId === r.id;
            return (
              <div key={r.id} className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
                {/* Row header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-[var(--surface-raised)] transition-colors"
                >
                  {/* Category icon */}
                  <div className="w-8 h-8 rounded-lg bg-[var(--surface-raised)] flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={CATEGORY_ICONS[r.category] || CATEGORY_ICONS.OTHER} />
                    </svg>
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm text-[var(--text)] truncate">{r.title}</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold border ${STATUS_COLORS[r.status] || STATUS_COLORS.OPEN}`}>
                        {formatLabel(r.status)}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${PRIORITY_COLORS[r.priority] || PRIORITY_COLORS.MEDIUM}`}>
                        {r.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                      <span>{r.booking.customer?.name || "Unknown"}</span>
                      <span>&middot;</span>
                      <span>{formatLabel(r.category)}</span>
                      <span>&middot;</span>
                      <span>{formatDate(r.createdAt)}</span>
                    </div>
                  </div>

                  {/* Expand chevron */}
                  <svg className={`w-5 h-5 text-[var(--text-muted)] shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[var(--border)]">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mb-4">
                      <div>
                        <div className="text-xs text-[var(--text-muted)] mb-1">Customer</div>
                        <div className="text-sm font-medium text-[var(--text)]">{r.booking.customer?.name}</div>
                        <div className="text-xs text-[var(--text-muted)]">{r.booking.customer?.email}</div>
                        {r.booking.customer?.phone && (
                          <div className="text-xs text-[var(--text-muted)]">{r.booking.customer.phone}</div>
                        )}
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-muted)] mb-1">Booking</div>
                        <a href={`/admin/bookings/${r.booking.id}`} className="text-sm font-mono text-[var(--primary)] hover:underline">
                          {r.booking.id.slice(0, 8)}
                        </a>
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-muted)] mb-1">Submitted</div>
                        <div className="text-sm text-[var(--text)]">{formatDateTime(r.createdAt)}</div>
                      </div>
                      {r.resolvedAt && (
                        <div>
                          <div className="text-xs text-[var(--text-muted)] mb-1">Resolved</div>
                          <div className="text-sm text-[var(--text)]">{formatDateTime(r.resolvedAt)}</div>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                      <div className="text-xs text-[var(--text-muted)] mb-1">Description</div>
                      <div className="text-sm text-[var(--text)] whitespace-pre-wrap bg-[var(--surface-raised)] rounded-lg p-3">
                        {r.description}
                      </div>
                    </div>

                    {/* Resolution */}
                    {r.resolution && (
                      <div className="mb-4">
                        <div className="text-xs text-[var(--text-muted)] mb-1">Resolution</div>
                        <div className="text-sm text-green-800 whitespace-pre-wrap bg-green-50 rounded-lg p-3 border border-green-200">
                          {r.resolution}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
                      {r.status === "OPEN" && (
                        <button
                          onClick={() => updateRequest(r.id, { status: "IN_PROGRESS" })}
                          disabled={actionLoading === r.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                        >
                          Start Working
                        </button>
                      )}

                      {["OPEN", "IN_PROGRESS"].includes(r.status) && (
                        <>
                          <button
                            onClick={() => {
                              setResolutionText(r.resolution || "");
                              setExpandedId(r.id);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors"
                          >
                            Resolve
                          </button>

                          {/* Resolution input */}
                          <div className="w-full mt-2">
                            <textarea
                              value={resolutionText}
                              onChange={(e) => setResolutionText(e.target.value)}
                              placeholder="Add resolution notes (optional)..."
                              rows={2}
                              className="w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus-ring resize-none"
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => resolveRequest(r.id)}
                                disabled={actionLoading === r.id}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                              >
                                {actionLoading === r.id ? "Saving..." : "Confirm Resolve"}
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {r.status === "RESOLVED" && (
                        <button
                          onClick={() => updateRequest(r.id, { status: "CLOSED" })}
                          disabled={actionLoading === r.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] disabled:opacity-50 transition-colors"
                        >
                          Close
                        </button>
                      )}

                      {/* Priority change */}
                      <select
                        value={r.priority}
                        onChange={(e) => updateRequest(r.id, { priority: e.target.value })}
                        disabled={actionLoading === r.id}
                        className="ml-auto rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-xs text-[var(--text)] focus-ring"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] disabled:opacity-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] disabled:opacity-50 transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
