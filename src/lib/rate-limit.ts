/**
 * Sliding window rate limiter.
 *
 * Production (Vercel): Uses Upstash Redis via REST API (stateless, serverless-safe).
 * Development:         Falls back to in-memory Map (single-instance only).
 *
 * Env vars for production:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Types ────────────────────────────────────────────────

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

// ── Upstash Redis backend ────────────────────────────────

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) {
    redis = new Redis({ url, token });
  }
  return redis;
}

/**
 * Convert windowMs to an Upstash duration string.
 * Upstash accepts: "Xs", "Xm", "Xh", "Xd"
 */
function toDuration(ms: number): `${number} s` | `${number} m` | `${number} h` | `${number} d` {
  if (ms >= 86_400_000 && ms % 86_400_000 === 0)
    return `${ms / 86_400_000} d`;
  if (ms >= 3_600_000 && ms % 3_600_000 === 0)
    return `${ms / 3_600_000} h`;
  if (ms >= 60_000 && ms % 60_000 === 0)
    return `${ms / 60_000} m`;
  return `${Math.ceil(ms / 1000)} s`;
}

// Cache Ratelimit instances so we don't recreate per request
const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(config: RateLimitConfig): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

  const cacheKey = `${config.limit}:${config.windowMs}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(config.limit, toDuration(config.windowMs)),
      prefix: "rl",
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

async function checkUpstash(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter(config)!;
  const { success, remaining, reset } = await limiter.limit(key);

  if (success) {
    return { allowed: true, remaining };
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return { allowed: false, remaining: 0, retryAfterSeconds };
}

// ── In-memory backend (dev fallback) ─────────────────────

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes (only runs in long-lived processes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < 600_000);
      if (entry.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 300_000);
}

function checkInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

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

// ── Public API ───────────────────────────────────────────

/**
 * Check rate limit for a given key.
 * Uses Upstash Redis in production, in-memory Map in development.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  if (getRedis()) {
    return checkUpstash(key, config);
  }
  return checkInMemory(key, config);
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

/** POST /api/portal/register — 5 attempts per IP per 30 minutes */
export const PORTAL_REGISTER_LIMIT: RateLimitConfig = {
  limit: 5,
  windowMs: 30 * 60 * 1000,
};
