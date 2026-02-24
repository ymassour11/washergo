import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { logger, AppLogger } from "@/lib/logger";
import { canTransition } from "@/lib/booking-machine";

/**
 * Process a Stripe webhook event inline.
 * Accepts a plain object so it can be called directly from the API route
 * (Vercel serverless) without requiring BullMQ.
 */
export async function processWebhookEvent(data: { stripeEventId: string }) {
  const { stripeEventId } = data;
  const log = logger.child({ stripeEventId });

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
      case "invoice.created":
        await handleInvoiceCreated(payload, log);
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

  if (canTransition(booking.status, "PAID_SETUP")) {
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
  } else if (booking.payAtDelivery && !booking.stripeSubscriptionId) {
    // Pay-at-delivery booking: already at PAID_SETUP but now collecting payment via Stripe
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        stripeCustomerId: session.customer || null,
        stripeSubscriptionId: session.subscription || null,
        stripeCheckoutSessionId: session.id,
      },
    });
    log.info({ bookingId }, "Stripe IDs saved for pay-at-delivery booking");
  } else {
    log.info({ currentStatus: booking.status }, "Booking not eligible for PAID_SETUP transition");
    return;
  }
}

async function handleInvoiceCreated(payload: Record<string, unknown>, log: AppLogger) {
  const invoice = payload as { id: string; subscription?: string; status?: string };
  if (!invoice.subscription || invoice.status !== "draft") return;

  const booking = await prisma.booking.findFirst({
    where: { stripeSubscriptionId: invoice.subscription },
  });
  if (!booking) return;

  await stripe.invoices.update(invoice.id, {
    statement_descriptor: "GOWASH",
  });
  log.info({ invoiceId: invoice.id }, "Set GOWASH statement descriptor on invoice");
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
    // TODO: Send payment failed notification (email/SMS)
    log.info({ bookingId: booking.id }, "Payment failed notification pending");
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
    // TODO: Send subscription canceled notification (email/SMS)
    log.info({ bookingId: booking.id }, "Subscription canceled notification pending");
    log.info({ bookingId: booking.id }, "Booking canceled due to subscription deletion");
  }
}
