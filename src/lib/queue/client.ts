import { Queue } from "bullmq";
import { getRedisConfig } from "@/lib/redis";

let _stripeWebhookQueue: Queue | null = null;
let _notificationQueue: Queue | null = null;
let _slotReleaseQueue: Queue | null = null;

/**
 * Queue for processing Stripe webhook events durably.
 */
export const stripeWebhookQueue = new Proxy({} as Queue, {
  get(_, prop) {
    if (!_stripeWebhookQueue) {
      _stripeWebhookQueue = new Queue("stripe-webhook", {
        connection: getRedisConfig(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
        },
      });
    }
    return (_stripeWebhookQueue as unknown as Record<string, unknown>)[prop as string];
  },
});

/**
 * Queue for sending notifications (email, SMS).
 * Stub for MVP — handlers log to console.
 */
export const notificationQueue = new Proxy({} as Queue, {
  get(_, prop) {
    if (!_notificationQueue) {
      _notificationQueue = new Queue("notifications", {
        connection: getRedisConfig(),
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 2000 },
        },
      });
    }
    return (_notificationQueue as unknown as Record<string, unknown>)[prop as string];
  },
});

/**
 * Queue for releasing delivery slot holds after timeout.
 */
export const slotReleaseQueue = new Proxy({} as Queue, {
  get(_, prop) {
    if (!_slotReleaseQueue) {
      _slotReleaseQueue = new Queue("slot-release", {
        connection: getRedisConfig(),
        defaultJobOptions: {
          attempts: 2,
          removeOnComplete: { count: 200 },
          removeOnFail: { count: 500 },
        },
      });
    }
    return (_slotReleaseQueue as unknown as Record<string, unknown>)[prop as string];
  },
});
