const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

/**
 * Create a Redis connection config for BullMQ.
 */
export function getRedisConfig() {
  const url = new URL(REDIS_URL);
  return {
    host: url.hostname || "localhost",
    port: Number(url.port) || 6379,
    maxRetriesPerRequest: null as null,
  };
}
