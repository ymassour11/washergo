/**
 * BullMQ Worker Process
 *
 * Run separately from the Next.js server:
 *   npm run worker
 */

import "dotenv/config";
import { Worker } from "bullmq";
import { getRedisConfig } from "@/lib/redis";
import { processWebhookEvent } from "@/lib/queue/handlers/process-webhook";
import { sendNotification } from "@/lib/queue/handlers/send-email";
import { releaseSlotHold } from "@/lib/queue/handlers/release-slot";
import { logger } from "@/lib/logger";

const log = logger.child({ service: "worker" });
const connection = getRedisConfig();

const webhookWorker = new Worker("stripe-webhook", processWebhookEvent, {
  connection,
  concurrency: 5,
});

webhookWorker.on("completed", (job) => {
  log.info({ jobId: job.id, queue: "stripe-webhook" }, "Job completed");
});

webhookWorker.on("failed", (job, err) => {
  log.error(
    { jobId: job?.id, queue: "stripe-webhook", error: err.message },
    "Job failed",
  );
});

const notificationWorker = new Worker("notifications", sendNotification, {
  connection,
  concurrency: 3,
});

notificationWorker.on("failed", (job, err) => {
  log.error(
    { jobId: job?.id, queue: "notifications", error: err.message },
    "Notification job failed",
  );
});

const slotReleaseWorker = new Worker("slot-release", releaseSlotHold, {
  connection,
  concurrency: 2,
});

slotReleaseWorker.on("failed", (job, err) => {
  log.error(
    { jobId: job?.id, queue: "slot-release", error: err.message },
    "Slot release job failed",
  );
});

log.info("Workers started: stripe-webhook, notifications, slot-release");

async function shutdown() {
  log.info("Shutting down workers...");
  await Promise.all([
    webhookWorker.close(),
    notificationWorker.close(),
    slotReleaseWorker.close(),
  ]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
