import { Job } from "bullmq";
import { logger } from "@/lib/logger";
import type { NotificationJob } from "@/lib/queue/jobs";

/**
 * Send email/SMS notifications.
 *
 * MVP: logs to console. Replace with real email service
 * (Resend, SendGrid, Postmark) when ready.
 */
export async function sendNotification(job: Job<NotificationJob>) {
  const { type, bookingId, email, phone, data } = job.data;
  const log = logger.child({ jobId: job.id, type, bookingId });

  switch (type) {
    case "booking_confirmation":
      log.info(
        { email, phone },
        "📧 [STUB] Sending booking confirmation email",
      );
      // TODO: Integrate Resend / SendGrid
      // await sendEmail({ to: email, template: "booking-confirmation", data });
      break;

    case "payment_failed":
      log.info(
        { email, phone },
        "📧 [STUB] Sending payment failure notification",
      );
      break;

    case "subscription_canceled":
      log.info(
        { email, phone },
        "📧 [STUB] Sending cancellation notification",
      );
      break;

    default:
      log.warn({ type }, "Unknown notification type");
  }
}
