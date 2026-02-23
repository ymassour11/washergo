"use client";

import { useState, useEffect, useCallback } from "react";

interface DeliverySlot {
  id: string;
  date: string;
  windowLabel: string;
  windowStart: string;
  windowEnd: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  _count: { bookings: number };
  slotHolds: Array<{ id: string }>;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function AdminDeliverySlotsPage() {
  const [slots, setSlots] = useState<DeliverySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);

  // Create form state
  const [newDate, setNewDate] = useState("");
  const [newWindowStart, setNewWindowStart] = useState("09:00");
  const [newWindowEnd, setNewWindowEnd] = useState("12:00");
  const [newCapacity, setNewCapacity] = useState(2);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (!showInactive) params.set("active", "true");
    const res = await fetch(`/api/admin/delivery-slots?${params}`);
    const data = await res.json();
    setSlots(data.slots || []);
    setLoading(false);
  }, [showInactive]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const createSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);

    const windowLabel = `${formatTime(newWindowStart)} - ${formatTime(newWindowEnd)}`;

    const res = await fetch("/api/admin/delivery-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: newDate,
        windowStart: newWindowStart,
        windowEnd: newWindowEnd,
        windowLabel,
        capacity: newCapacity,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setCreateError(data.error || "Failed to create slot");
      setCreating(false);
      return;
    }

    setShowCreate(false);
    setNewDate("");
    setCreating(false);
    fetchSlots();
  };

  const toggleActive = async (slotId: string, isActive: boolean) => {
    setActionLoading(slotId);
    try {
      const res = await fetch(`/api/admin/delivery-slots/${slotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update slot");
      }
    } catch {
      alert("Network error");
    }
    setActionLoading(null);
    fetchSlots();
  };

  function formatTime(time: string): string {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }

  // Group slots by date
  const grouped = slots.reduce<Record<string, DeliverySlot[]>>((acc, slot) => {
    const key = slot.date.split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(slot);
    return acc;
  }, {});

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Delivery Slots</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manage delivery windows and capacity</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Slot
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6 mb-6">
          <h2 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-4">Create Delivery Slot</h2>
          <form onSubmit={createSlot} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Start Time</label>
              <input
                type="time"
                value={newWindowStart}
                onChange={(e) => setNewWindowStart(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">End Time</label>
              <input
                type="time"
                value={newWindowEnd}
                onChange={(e) => setNewWindowEnd(e.target.value)}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 block">Capacity</label>
              <input
                type="number"
                value={newCapacity}
                onChange={(e) => setNewCapacity(Number(e.target.value))}
                min={1}
                max={20}
                required
                className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm focus-ring"
              />
            </div>
            <div className="sm:col-span-4 flex items-center gap-3">
              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--primary-dark)] disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create Slot"}
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
      <div className="flex items-center gap-3 mb-6">
        <label className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-[var(--border)]"
          />
          Show deactivated slots
        </label>
        <span className="text-sm text-[var(--text-muted)]">{slots.length} slot{slots.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Slots grouped by date */}
      {loading ? (
        <div className="rounded-xl border border-[var(--border)] bg-white p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded animate-shimmer" />
            ))}
          </div>
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-white py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--surface-raised)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="text-[var(--text-secondary)] font-medium">No delivery slots found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Create a new slot to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dateKey, dateSlots]) => (
            <div key={dateKey}>
              <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-3">
                {formatDate(dateKey)}
              </h3>
              <div className="space-y-2">
                {dateSlots.map((slot) => {
                  const booked = slot._count.bookings;
                  const holds = slot.slotHolds.length;
                  const available = Math.max(0, slot.capacity - booked - holds);
                  const usagePct = slot.capacity > 0 ? ((booked + holds) / slot.capacity) * 100 : 0;

                  return (
                    <div
                      key={slot.id}
                      className={`rounded-xl border bg-white p-4 flex items-center gap-4 ${
                        slot.isActive ? "border-[var(--border)]" : "border-stone-200 bg-stone-50 opacity-60"
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[var(--text)]">{slot.windowLabel}</span>
                          {!slot.isActive && (
                            <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-500">
                              Deactivated
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
                          <span>{booked} booked</span>
                          {holds > 0 && <span className="text-amber-600">{holds} held</span>}
                          <span className={available === 0 ? "text-red-600 font-bold" : "text-green-600"}>
                            {available} available
                          </span>
                        </div>
                      </div>

                      {/* Capacity bar */}
                      <div className="w-32 hidden sm:block">
                        <div className="h-2 bg-[var(--surface-raised)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${usagePct >= 100 ? "bg-red-400" : usagePct >= 50 ? "bg-amber-400" : "bg-green-400"}`}
                            style={{ width: `${Math.min(usagePct, 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1 text-center">
                          {booked + holds}/{slot.capacity}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleActive(slot.id, slot.isActive)}
                        disabled={actionLoading === slot.id}
                        className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                          slot.isActive
                            ? "border border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                            : "bg-green-600 text-white hover:bg-green-700"
                        }`}
                      >
                        {slot.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
