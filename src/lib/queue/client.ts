import { Queue } from "bullmq";
import { getRedisConfig } from "@/lib/redis";

const connection = getRedisConfig();

/**
 * Queue for processing Stripe webhook events durably.
 */
export const stripeWebhookQueue = new Queue("stripe-webhook", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

/**
 * Queue for sending notifications (email, SMS).
 * Stub for MVP — handlers log to console.
 */
export const notificationQueue = new Queue("notifications", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 2000 },
    removeOnComplete: { count: 500 },
    removeOnFail: { count: 2000 },
  },
});

/**
 * Queue for releasing delivery slot holds after timeout.
 */
export const slotReleaseQueue = new Queue("slot-release", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 500 },
  },
});
