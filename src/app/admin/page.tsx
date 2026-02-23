"use client";

import { useState, useEffect } from "react";

interface Stats {
  bookings: {
    total: number;
    byStatus: Record<string, number>;
    active: number;
    pastDue: number;
  };
  customers: { total: number };
  revenue: { thisMonthCents: number };
  upcomingDeliveries: number;
  assets: {
    total: number;
    byStatus: Record<string, number>;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    targetId: string | null;
    details: Record<string, unknown> | null;
    createdAt: string;
    user: { email: string };
  }>;
}

function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(cents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-white p-5">
      <p className="text-sm font-medium text-[var(--text-muted)]">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] mt-1">{sub}</p>}
    </div>
  );
}

function ActionLabel({ action }: { action: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    "booking.mark_active": { label: "Marked Active", color: "text-green-700 bg-green-50" },
    "booking.cancel": { label: "Canceled", color: "text-red-700 bg-red-50" },
    "booking.close": { label: "Closed", color: "text-stone-700 bg-stone-100" },
    "booking.update_notes": { label: "Notes Updated", color: "text-blue-700 bg-blue-50" },
    "delivery_slot.create": { label: "Slot Created", color: "text-teal-700 bg-teal-50" },
    "delivery_slot.update": { label: "Slot Updated", color: "text-teal-700 bg-teal-50" },
    "asset.create": { label: "Asset Added", color: "text-violet-700 bg-violet-50" },
    "asset.update": { label: "Asset Updated", color: "text-violet-700 bg-violet-50" },
  };
  const config = labels[action] || { label: action, color: "text-stone-600 bg-stone-50" };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${config.color}`}>
      {config.label}
    </span>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <div className="h-7 w-40 rounded animate-shimmer mb-2" />
          <div className="h-4 w-64 rounded animate-shimmer" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-[var(--border)] bg-white p-5">
              <div className="h-4 w-20 rounded animate-shimmer mb-3" />
              <div className="h-8 w-16 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-[var(--text-muted)]">Failed to load dashboard stats.</p>
      </div>
    );
  }

  const statusOrder = ["DRAFT", "QUALIFIED", "SCHEDULED", "PAID_SETUP", "CONTRACT_SIGNED", "ACTIVE", "PAST_DUE", "CANCELED", "CLOSED"];
  const statusColors: Record<string, string> = {
    DRAFT: "bg-stone-200", QUALIFIED: "bg-sky-400", SCHEDULED: "bg-blue-400",
    PAID_SETUP: "bg-violet-400", CONTRACT_SIGNED: "bg-teal-400", ACTIVE: "bg-green-400",
    PAST_DUE: "bg-red-400", CANCELED: "bg-stone-300", CLOSED: "bg-stone-300",
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Overview of your GoWash operations</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Bookings" value={stats.bookings.active} color="text-green-600" sub={stats.bookings.pastDue > 0 ? `${stats.bookings.pastDue} past due` : undefined} />
        <StatCard label="Revenue This Month" value={formatCents(stats.revenue.thisMonthCents)} color="text-[var(--text)]" />
        <StatCard label="Upcoming Deliveries" value={stats.upcomingDeliveries} color="text-blue-600" sub="Next 7 days" />
        <StatCard label="Total Customers" value={stats.customers.total} color="text-[var(--text)]" sub={`${stats.assets.total} assets tracked`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bookings by Status */}
        <div className="rounded-xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Bookings by Status</h2>
          <div className="space-y-3">
            {statusOrder.map((status) => {
              const count = stats.bookings.byStatus[status] || 0;
              const pct = stats.bookings.total > 0 ? (count / stats.bookings.total) * 100 : 0;
              return (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-32 text-xs font-medium text-[var(--text-secondary)] truncate">
                    {status.replace(/_/g, " ")}
                  </div>
                  <div className="flex-1 h-2 bg-[var(--surface-raised)] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusColors[status]}`} style={{ width: `${Math.max(pct, 1)}%` }} />
                  </div>
                  <div className="w-8 text-xs font-bold text-[var(--text)] text-right">{count}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between text-sm">
            <span className="text-[var(--text-muted)]">Total</span>
            <span className="font-bold text-[var(--text)]">{stats.bookings.total}</span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-[var(--border)] bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider">Recent Activity</h2>
            <a href="/admin/audit-logs" className="text-xs font-medium text-[var(--primary)] hover:underline">View all</a>
          </div>
          {stats.recentActivity.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">No activity yet</p>
          ) : (
            <div className="space-y-3">
              {stats.recentActivity.map((log) => (
                <div key={log.id} className="flex items-start gap-3 py-2">
                  <div className="w-7 h-7 rounded-full bg-[var(--surface-raised)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)] shrink-0 mt-0.5">
                    {log.user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[var(--text)]">{log.user.email.split("@")[0]}</span>
                      <ActionLabel action={log.action} />
                    </div>
                    {log.targetId && (
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{log.targetId.slice(0, 8)}</p>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text-muted)] shrink-0">{formatDate(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
