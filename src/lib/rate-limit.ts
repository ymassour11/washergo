/**
 * Simple in-memory sliding window rate limiter.
 *
 * For production at scale, replace with Redis-based rate limiting.
 * This is good enough for single-instance deployments.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 600_000);
    if (entry.timestamps.length === 0) {
      store.delete(key);
    }
  }
}, 300_000);

interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in milliseconds */
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds?: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.limit) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + config.windowMs - now;
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.limit - entry.timestamps.length,
  };
}

// ── Preset configs ───────────────────────────────────────

/** POST /api/bookings — 5 new bookings per IP per 10 minutes */
export const BOOKING_CREATE_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 10 * 60 * 1000,
};

/** PATCH /api/bookings/:id — 30 updates per token per 10 minutes */
export const BOOKING_UPDATE_LIMIT: RateLimitConfig = {
  limit: 30,
  windowMs: 10 * 60 * 1000,
};

/** POST /api/admin/auth — 5 login attempts per IP per 15 minutes */
export const ADMIN_LOGIN_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 15 * 60 * 1000,
};
