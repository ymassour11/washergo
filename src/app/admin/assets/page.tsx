"use client";

import { useState, useEffect, useCallback } from "react";

interface Asset {
  id: string;
  type: string;
  serialNumber: string;
  model: string;
  condition: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  assignments: Array<{
    id: string;
    installedAt: string | null;
    removedAt: string | null;
    booking: {
      id: string;
      status: string;
      customer: { name: string } | null;
    };
  }>;
  _count: { maintenanceLogs: number };
}

const STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  AVAILABLE: { bg: "bg-green-50", text: "text-green-700" },
  ASSIGNED: { bg: "bg-blue-50", text: "text-blue-700" },
  MAINTENANCE: { bg: "bg-amber-50", text: "text-amber-700" },
  RETIRED: { bg: "bg-stone-100", text: "text-stone-500" },
};

const CONDITION_CONFIG: Record<string, { bg: string; text: string }> = {
  NEW: { bg: "bg-green-50", text: "text-green-700" },
  GOOD: { bg: "bg-teal-50", text: "text-teal-700" },
  FAIR: { bg: "bg-amber-50", text: "text-amber-700" },
  POOR: { bg: "bg-red-50", text: "text-red-700" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Create form state
  const [newType, setNewType] = useState("WASHER");
  const [newSerial, setNewSerial] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newCondition, setNewCondition] = useState("NEW");
  const [newNotes, setNewNotes] = useState("");

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (typeFilter) params.set("type", typeFilter);
    const res = await fetch(`/api/admin/assets?${params}`);
    const data = await res.json();
    setAssets(data.assets || []);
    setLoading(false);
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const createAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    const res = await fetch("/api/admin/assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: newType,
        serialNumber: newSerial,
        model: newModel,
        condition: newCondition,
        notes: newNotes || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setCreateError(data.error || "Failed to create asset");
      setCreating(false);
      return;
    }

    setShowCreate(false);
    setNewSerial("");
    setNewModel("");
    setNewNotes("");
    setCreating(false);
    fetchAssets();
  };

  const updateStatus = async (assetId: string, status: string) => {
    setActionLoading(assetId);
    try {
      const res = await fetch(`/api/admin/assets/${assetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update asset");
      }
    } catch {
      alert("Network error");
    }
    setActionLoading(null);
    fetchAssets();
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Assets</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Track washers and dryers in your inventory</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Asset
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6 mb-6">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Add New Asset</h2>
          <form onSubmit={createAsset} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Type</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus-ring"
              >
                <option value="WASHER">Washer</option>
                <option value="DRYER">Dryer</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Serial Number</label>
              <input
                type="text"
                value={newSerial}
                onChange={(e) => setNewSerial(e.target.value)}
                required
                placeholder="e.g. WH-2024-001"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Model</label>
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                required
                placeholder="e.g. Samsung WF45T6000AW"
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Condition</label>
              <select
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus-ring"
              >
                <option value="NEW">New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Notes (optional)</label>
              <input
                type="text"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Any additional notes..."
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus-ring"
              />
            </div>
            <div className="sm:col-span-3 flex items-center gap-3">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
              >
                {creating ? "Adding..." : "Add Asset"}
              </button>
              <button
                type="button"
                onClick={() => { setShowCreate(false); setCreateError(null); }}
                className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Cancel
              </button>
              {createError && <span className="text-sm text-red-600">{createError}</span>}
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="appearance-none rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 pr-10 text-sm font-medium text-[var(--text-secondary)] focus-ring cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="WASHER">Washer</option>
            <option value="DRYER">Dryer</option>
          </select>
          <svg className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 pr-10 text-sm font-medium text-[var(--text-secondary)] focus-ring cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="RETIRED">Retired</option>
          </select>
          <svg className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
        <span className="text-sm text-[var(--text-muted)]">{assets.length} asset{assets.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Assets List */}
      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded animate-shimmer" />
            ))}
          </div>
        </div>
      ) : assets.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-white py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] font-medium">No assets found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Add a washer or dryer to start tracking inventory.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assets.map((asset) => {
            const statusConf = STATUS_CONFIG[asset.status] || STATUS_CONFIG.AVAILABLE;
            const condConf = CONDITION_CONFIG[asset.condition] || CONDITION_CONFIG.NEW;
            const activeAssignment = asset.assignments.find((a) => !a.removedAt);

            return (
              <div key={asset.id} className="rounded-xl border border-[var(--border)] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${asset.type === "WASHER" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[var(--text)]">{asset.model}</span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${statusConf.bg} ${statusConf.text}`}>
                          {asset.status}
                        </span>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${condConf.bg} ${condConf.text}`}>
                          {asset.condition}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-muted)]">
                        <span className="font-mono">{asset.serialNumber}</span>
                        <span>{asset.type}</span>
                        <span>{asset._count.maintenanceLogs} maintenance log{asset._count.maintenanceLogs !== 1 ? "s" : ""}</span>
                      </div>
                      {activeAssignment && (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[var(--surface-raised)] px-2.5 py-1 text-xs">
                          <span className="text-[var(--text-muted)]">Assigned to</span>
                          <a href={`/admin/bookings/${activeAssignment.booking.id}`} className="font-medium text-[var(--primary)] hover:underline">
                            {activeAssignment.booking.customer?.name || activeAssignment.booking.id.slice(0, 8)}
                          </a>
                        </div>
                      )}
                      {asset.notes && (
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{asset.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className="relative">
                      <select
                        value={asset.status}
                        onChange={(e) => updateStatus(asset.id, e.target.value)}
                        disabled={actionLoading === asset.id}
                        className="appearance-none rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 pr-8 text-xs font-medium text-[var(--text-secondary)] focus-ring cursor-pointer disabled:opacity-50"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="MAINTENANCE">Maintenance</option>
                        <option value="RETIRED">Retired</option>
                      </select>
                      <svg className="w-3 h-3 text-[var(--text-muted)] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
