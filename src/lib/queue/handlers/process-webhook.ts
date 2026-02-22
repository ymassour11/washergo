import { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { logger, AppLogger } from "@/lib/logger";
import { canTransition } from "@/lib/booking-machine";
import { notificationQueue } from "@/lib/queue/client";
import type { StripeWebhookJob } from "@/lib/queue/jobs";

export async function processWebhookEvent(job: Job<StripeWebhookJob>) {
  const { stripeEventId } = job.data;
  const log = logger.child({ stripeEventId, jobId: job.id });

  const event = await prisma.stripeEvent.findUnique({
    where: { stripeEventId },
  });

  if (!event) {
    log.warn("Stripe event not found in DB, skipping");
    return;
  }

  if (event.processed) {
    log.info("Event already processed, skipping (idempotent)");
    return;
  }

  const payload = event.payload as Record<string, unknown>;

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutComplete(payload, log);
        break;
      case "invoice.paid":
        await handleInvoicePaid(payload, log);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(payload, log);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(payload, log);
        break;
      case "customer.subscription.updated":
        log.info("Subscription updated event received");
        break;
      default:
        log.info({ type: event.type }, "Unhandled event type, ignoring");
    }

    await prisma.stripeEvent.update({
      where: { id: event.id },
      data: { processed: true, processedAt: new Date() },
    });

    log.info("Event processed successfully");
  } catch (error) {
    log.error({ error }, "Failed to process webhook event");
    await prisma.stripeEvent.update({
      where: { id: event.id },
      data: { error: String(error) },
    });
    throw error;
  }
}

async function handleCheckoutComplete(payload: Record<string, unknown>, log: AppLogger) {
  const session = payload as {
    id: string;
    metadata?: { bookingId?: string };
    customer?: string;
    subscription?: string;
  };

  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    log.warn("checkout.session.completed missing bookingId in metadata");
    return;
  }

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) {
    log.warn({ bookingId }, "Booking not found for checkout session");
    return;
  }

  if (!canTransition(booking.status, "PAID_SETUP")) {
    log.info({ currentStatus: booking.status }, "Booking not eligible for PAID_SETUP transition");
    return;
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "PAID_SETUP",
      stripeCustomerId: session.customer || null,
      stripeSubscriptionId: session.subscription || null,
      stripeCheckoutSessionId: session.id,
      currentStep: 7,
    },
  });

  log.info({ bookingId }, "Booking advanced to PAID_SETUP");
}

async function handleInvoicePaid(payload: Record<string, unknown>, log: AppLogger) {
  const invoice = payload as {
    id: string;
    subscription?: string;
    amount_paid?: number;
    currency?: string;
    invoice_pdf?: string;
    hosted_invoice_url?: string;
  };

  if (!invoice.subscription) return;

  const booking = await prisma.booking.findFirst({
    where: { stripeSubscriptionId: invoice.subscription },
  });

  if (!booking) {
    log.warn("No booking found for subscription invoice");
    return;
  }

  await prisma.paymentRecord.upsert({
    where: { stripeInvoiceId: invoice.id },
    update: {
      status: "paid",
      paidAt: new Date(),
      invoicePdfUrl: invoice.invoice_pdf || null,
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
    },
    create: {
      bookingId: booking.id,
      stripeInvoiceId: invoice.id,
      amountCents: invoice.amount_paid || 0,
      currency: invoice.currency || "usd",
      status: "paid",
      paidAt: new Date(),
      invoicePdfUrl: invoice.invoice_pdf || null,
      hostedInvoiceUrl: invoice.hosted_invoice_url || null,
    },
  });

  if (booking.status === "PAST_DUE" && canTransition("PAST_DUE", "ACTIVE")) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "ACTIVE" },
    });
    log.info({ bookingId: booking.id }, "Booking restored to ACTIVE from PAST_DUE");
  }
}

async function handleInvoicePaymentFailed(payload: Record<string, unknown>, log: AppLogger) {
  const invoice = payload as { subscription?: string };
  if (!invoice.subscription) return;

  const booking = await prisma.booking.findFirst({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (!booking) return;

  if (booking.status === "ACTIVE" && canTransition("ACTIVE", "PAST_DUE")) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "PAST_DUE" },
    });
    await notificationQueue.add("payment-failed", {
      type: "payment_failed",
      bookingId: booking.id,
    });
    log.info({ bookingId: booking.id }, "Booking marked PAST_DUE");
  }
}

async function handleSubscriptionDeleted(payload: Record<string, unknown>, log: AppLogger) {
  const sub = payload as { id: string };

  const booking = await prisma.booking.findFirst({
    where: { stripeSubscriptionId: sub.id },
  });
  if (!booking) return;

  if (canTransition(booking.status, "CANCELED")) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELED" },
    });
    await notificationQueue.add("subscription-canceled", {
      type: "subscription_canceled",
      bookingId: booking.id,
    });
    log.info({ bookingId: booking.id }, "Booking canceled due to subscription deletion");
  }
}
