"use client";

import { useState, useEffect, useCallback } from "react";
import { StatusBadge } from "@/components/admin/status-badge";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  bookings: Array<{
    id: string;
    status: string;
    packageType: string | null;
    createdAt: string;
  }>;
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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("page", String(page));

    const res = await fetch(`/api/admin/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setPagination(data.pagination || null);
    setLoading(false);
  }, [search, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text)]">Customers</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">View all customers and their booking history</p>
      </div>

      {/* Search */}
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
        {pagination && (
          <span className="text-sm text-[var(--text-muted)]">
            {pagination.total} customer{pagination.total !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full animate-shimmer" />
                <div className="flex-1 h-4 rounded animate-shimmer" />
                <div className="w-24 h-4 rounded animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-white py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] font-medium">No customers found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {search ? "Try a different search term." : "Customers will appear here when bookings are created."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <div key={c.id} className="rounded-xl border border-[var(--border)] bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--text)]">{c.name}</div>
                    <div className="text-sm text-[var(--text-muted)] mt-0.5">{c.email}</div>
                    <div className="text-sm text-[var(--text-muted)]">{c.phone}</div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-[var(--text-muted)]">Joined {formatDate(c.createdAt)}</div>
                  <div className="text-sm font-medium text-[var(--text-secondary)] mt-0.5">
                    {c.bookings.length} booking{c.bookings.length !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
              {c.bookings.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <div className="flex flex-wrap gap-2">
                    {c.bookings.slice(0, 5).map((b) => (
                      <a
                        key={b.id}
                        href={`/admin/bookings/${b.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--surface-raised)] px-3 py-1.5 text-xs hover:bg-[var(--border)] transition-colors"
                      >
                        <code className="font-mono text-[var(--primary)]">{b.id.slice(0, 8)}</code>
                        <StatusBadge status={b.status} />
                        {b.packageType && <span className="text-[var(--text-muted)]">{b.packageType.replace(/_/g, " ")}</span>}
                      </a>
                    ))}
                    {c.bookings.length > 5 && (
                      <span className="text-xs text-[var(--text-muted)] self-center">+{c.bookings.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
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
