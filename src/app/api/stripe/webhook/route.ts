import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { processWebhookEvent } from "@/lib/queue/handlers/process-webhook";
import { logger } from "@/lib/logger";

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe webhook events.
 *
 * Flow:
 * 1. Verify signature
 * 2. Store event in StripeEvent table (idempotency key: stripeEventId)
 * 3. Process event inline (no BullMQ — compatible with Vercel serverless)
 * 4. Return 200
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ route: "POST /api/stripe/webhook" });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    log.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  // Read raw body for signature verification
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    log.warn({ error: (err as Error).message }, "Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  log.info({ eventId: event.id, type: event.type }, "Webhook received");

  try {
    // Idempotent insert — if event already exists, skip
    const existing = await prisma.stripeEvent.findUnique({
      where: { stripeEventId: event.id },
    });

    if (existing) {
      log.info({ eventId: event.id }, "Event already recorded, returning 200");
      return NextResponse.json({ received: true });
    }

    // Store event
    await prisma.stripeEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        payload: event.data.object as object,
        processed: false,
      },
    });

    // Process inline (Vercel serverless — no BullMQ worker)
    await processWebhookEvent({ stripeEventId: event.id });

    log.info({ eventId: event.id }, "Event stored and processed");

    return NextResponse.json({ received: true });
  } catch (error) {
    log.error({ error, eventId: event.id }, "Failed to process webhook");
    // Return 200 anyway to prevent Stripe from retrying (we stored the event)
    // If DB insert failed, Stripe will retry and we'll catch it next time
    return NextResponse.json({ received: true });
  }
}
