"use client";

import { useState, useEffect, useCallback } from "react";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  user: { email: string; name: string | null };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  "booking.mark_active": { label: "Marked Active", color: "text-green-700 bg-green-50" },
  "booking.cancel": { label: "Booking Canceled", color: "text-red-700 bg-red-50" },
  "booking.close": { label: "Booking Closed", color: "text-stone-700 bg-stone-100" },
  "booking.update_notes": { label: "Notes Updated", color: "text-blue-700 bg-blue-50" },
  "delivery_slot.create": { label: "Slot Created", color: "text-teal-700 bg-teal-50" },
  "delivery_slot.update": { label: "Slot Updated", color: "text-teal-700 bg-teal-50" },
  "asset.create": { label: "Asset Added", color: "text-violet-700 bg-violet-50" },
  "asset.update": { label: "Asset Updated", color: "text-violet-700 bg-violet-50" },
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    params.set("page", String(page));
    params.set("limit", "50");

    const res = await fetch(`/api/admin/audit-logs?${params}`);
    const data = await res.json();
    setLogs(data.logs || []);
    setPagination(data.pagination || null);
    setLoading(false);
  }, [actionFilter, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actionTypes = [
    "", "booking", "delivery_slot", "asset",
  ];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Audit Logs</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Track all admin actions and system events</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="appearance-none rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 pr-10 text-sm font-medium text-[var(--text-secondary)] focus-ring cursor-pointer"
          >
            <option value="">All Actions</option>
            {actionTypes.filter(Boolean).map((a) => (
              <option key={a} value={a}>{a.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</option>
            ))}
          </select>
          <svg className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        {pagination && (
          <span className="text-sm text-[var(--text-muted)]">
            {pagination.total} log{pagination.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Logs */}
      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full animate-shimmer" />
                <div className="flex-1 h-4 rounded animate-shimmer" />
                <div className="w-32 h-4 rounded animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-white py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] font-medium">No audit logs found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Actions will be logged as admins perform operations.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-white overflow-hidden">
          <div className="divide-y divide-[var(--border)]">
            {logs.map((log) => {
              const actionConf = ACTION_LABELS[log.action] || { label: log.action, color: "text-stone-600 bg-stone-50" };
              return (
                <div key={log.id} className="px-5 py-4 flex items-start gap-4 hover:bg-[var(--surface-raised)]/50 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] shrink-0 mt-0.5">
                    {log.user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--text)]">
                        {log.user.name || log.user.email.split("@")[0]}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${actionConf.color}`}>
                        {actionConf.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--text-muted)]">
                      {log.targetId && (
                        <span className="font-mono">{log.targetId.slice(0, 8)}</span>
                      )}
                      {log.ip && log.ip !== "unknown" && (
                        <span>{log.ip}</span>
                      )}
                      {log.details && typeof log.details === "object" && Object.keys(log.details).length > 0 && (
                        <span className="truncate max-w-xs" title={JSON.stringify(log.details)}>
                          {Object.entries(log.details)
                            .slice(0, 2)
                            .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
                            .join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] shrink-0 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= pagination.totalPages}
            className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-raised)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
