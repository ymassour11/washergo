import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const SLOT_WINDOWS = [
  { label: "8:00 AM - 11:00 AM", start: "08:00", end: "11:00" },
  { label: "12:00 PM - 3:00 PM", start: "12:00", end: "15:00" },
  { label: "3:00 PM - 6:00 PM", start: "15:00", end: "18:00" },
];

const DEFAULT_CAPACITY = 3;
const WEEKS_AHEAD = 4;

/** In-memory guard: only run generation once per 24 hours */
let lastGeneratedAt = 0;
const GENERATION_INTERVAL_MS = 24 * 60 * 60 * 1000;

/**
 * Ensure delivery slots exist for the next 4 weeks (all 7 days).
 * Uses upsert so it's idempotent — safe to call on every request.
 * Skips if already ran within the last 24 hours.
 */
export async function ensureDeliverySlots(force = false): Promise<void> {
  const now = Date.now();
  if (!force && now - lastGeneratedAt < GENERATION_INTERVAL_MS) return;

  const log = logger.child({ fn: "ensureDeliverySlots" });

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let created = 0;
    for (let dayOffset = 1; dayOffset <= WEEKS_AHEAD * 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      for (const window of SLOT_WINDOWS) {
        const result = await prisma.deliverySlot.upsert({
          where: {
            date_windowStart: { date, windowStart: window.start },
          },
          update: {},
          create: {
            date,
            windowLabel: window.label,
            windowStart: window.start,
            windowEnd: window.end,
            capacity: DEFAULT_CAPACITY,
          },
        });
        // upsert returns the record; if createdAt is very recent, it was just created
        if (result.createdAt.getTime() > now - 5000) created++;
      }
    }

    lastGeneratedAt = now;
    if (created > 0) {
      log.info({ created }, "Auto-generated delivery slots");
    }
  } catch (error) {
    log.error({ error }, "Failed to auto-generate delivery slots");
  }
}

/** Exported for use in seed script */
export { SLOT_WINDOWS, DEFAULT_CAPACITY, WEEKS_AHEAD };
