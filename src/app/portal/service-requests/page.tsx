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
}

const CATEGORIES = [
  { value: "MAINTENANCE", label: "Maintenance / Repair" },
  { value: "BILLING", label: "Billing Issue" },
  { value: "MOVE_REQUEST", label: "Move Request" },
  { value: "CANCELLATION", label: "Cancellation Request" },
  { value: "OTHER", label: "Other" },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function categoryLabel(cat: string): string {
  return CATEGORIES.find((c) => c.value === cat)?.label || cat;
}

function statusColor(status: string): string {
  switch (status) {
    case "OPEN": return "bg-[#0055FF]/10 text-[#0055FF]";
    case "IN_PROGRESS": return "bg-amber-100 text-amber-700";
    case "RESOLVED": return "bg-green-100 text-green-700";
    case "CLOSED": return "bg-black/5 text-black/40";
    default: return "bg-black/5 text-black/40";
  }
}

export default function PortalServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [category, setCategory] = useState("MAINTENANCE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = useCallback(async () => {
    const res = await fetch("/api/portal/service-requests");
    const data = await res.json();
    setRequests(data.requests || []);
  }, []);

  useEffect(() => {
    fetchRequests().finally(() => setLoading(false));
  }, [fetchRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (title.length < 3) {
      setFormError("Title must be at least 3 characters");
      return;
    }
    if (description.length < 10) {
      setFormError("Description must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to submit request");
        return;
      }

      // Reset form and refresh list
      setTitle("");
      setDescription("");
      setCategory("MAINTENANCE");
      setShowForm(false);
      await fetchRequests();
    } catch {
      setFormError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-3xl space-y-6">
          <div className="rounded-xl border-2 border-black/5 bg-white p-6">
            <div className="h-4 w-32 rounded bg-black/5 animate-pulse mb-4" />
            <div className="h-4 w-full rounded bg-black/5 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-black tracking-tight">Service Requests</h1>
          <p className="text-sm text-black/40 mt-1 font-medium">Get help with maintenance, billing, moves, or cancellations</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0055FF] px-5 py-3 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#0044CC] transition-colors shadow-lg shadow-[#0055FF]/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Request
          </button>
        )}
      </div>

      <div className="max-w-3xl space-y-6">
        {/* New Request Form */}
        {showForm && (
          <section className="rounded-xl border-2 border-[#0055FF]/20 bg-[#0055FF]/[0.03] p-6">
            <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-5">New Service Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-lg border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3 text-sm text-black focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] transition-colors"
                  placeholder="Brief summary of the issue"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] resize-none transition-colors"
                  placeholder="Describe the issue in detail..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0055FF] px-5 py-3 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#0044CC] disabled:opacity-50 transition-colors shadow-lg shadow-[#0055FF]/20"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setFormError(""); }}
                  className="inline-flex items-center rounded-lg border-2 border-black/10 bg-white px-5 py-3 text-sm font-bold text-black/50 hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Requests List */}
        {requests.length === 0 ? (
          <section className="rounded-xl border-2 border-black/5 bg-white p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-black/5 mb-4">
              <svg className="w-7 h-7 text-black/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <p className="text-black font-bold text-sm">No service requests yet.</p>
            <p className="text-black/30 text-xs mt-1 font-medium">Need help? Click &quot;New Request&quot; above.</p>
          </section>
        ) : (
          <div className="space-y-4">
            {requests.map((r) => (
              <section key={r.id} className="rounded-xl border-2 border-black/5 bg-white p-5 hover:border-black/10 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${statusColor(r.status)}`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] font-bold text-black/30 bg-black/5 rounded-md px-2.5 py-1 uppercase tracking-wider">
                      {categoryLabel(r.category)}
                    </span>
                  </div>
                  <span className="text-xs text-black/30 font-medium shrink-0">{formatDate(r.createdAt)}</span>
                </div>
                <h3 className="font-bold text-black text-sm">{r.title}</h3>
                <p className="text-sm text-black/50 mt-1 line-clamp-2 font-medium">{r.description}</p>
                {r.resolution && (
                  <div className="mt-3 p-3.5 rounded-lg bg-green-50 border-2 border-green-100">
                    <div className="text-[10px] font-bold text-green-700 mb-1 uppercase tracking-widest">Resolution</div>
                    <p className="text-sm text-green-800 font-medium">{r.resolution}</p>
                  </div>
                )}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
