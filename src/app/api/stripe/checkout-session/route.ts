import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { verifyBookingToken, BOOKING_TOKEN_COOKIE } from "@/lib/booking-token";
import { isAtLeast } from "@/lib/booking-machine";
import { getPricing } from "@/lib/config";
import { logger } from "@/lib/logger";
import type { TermType } from "@prisma/client";
import type Stripe from "stripe";

/**
 * POST /api/stripe/checkout-session
 *
 * Creates a Stripe Checkout session for setup fee + monthly subscription.
 * Uses subscription mode with a recurring price and (optionally) a one-time setup fee.
 * 12-month terms have $0 setup fee so no setup line item is added.
 *
 * Body: { bookingId: string }
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ route: "POST /api/stripe/checkout-session" });

  const token = req.cookies.get(BOOKING_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Missing booking token" }, { status: 401 });
  }

  let body: { bookingId: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bookingId, locale } = body;

  const tokenBookingId = verifyBookingToken(token);
  if (tokenBookingId !== bookingId) {
    return NextResponse.json({ error: "Invalid booking token" }, { status: 403 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!isAtLeast(booking.status, "SCHEDULED")) {
    return NextResponse.json(
      { error: "Booking must complete delivery selection first" },
      { status: 409 },
    );
  }

  if (isAtLeast(booking.status, "PAID_SETUP")) {
    return NextResponse.json(
      { error: "Payment already completed" },
      { status: 409 },
    );
  }

  if (!booking.packageType || !booking.termType) {
    return NextResponse.json({ error: "Package and term must be selected" }, { status: 400 });
  }

  const pricing = getPricing(booking.packageType, booking.termType as TermType);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

  const monthlyPriceId = process.env[pricing.stripeMonthlyPriceIdEnvKey]?.trim();
  if (!monthlyPriceId) {
    log.error({ envKey: pricing.stripeMonthlyPriceIdEnvKey }, "Monthly Stripe price ID not configured");
    return NextResponse.json(
      { error: "Payment configuration error. Please contact support." },
      { status: 500 },
    );
  }

  // Build line items — only include setup fee if > $0
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: monthlyPriceId, quantity: 1 },
  ];

  if (pricing.setupFeeCents > 0 && pricing.stripeSetupPriceIdEnvKey) {
    const setupPriceId = process.env[pricing.stripeSetupPriceIdEnvKey]?.trim();
    if (!setupPriceId) {
      log.error({ envKey: pricing.stripeSetupPriceIdEnvKey }, "Setup fee Stripe price ID not configured");
      return NextResponse.json(
        { error: "Payment configuration error. Please contact support." },
        { status: 500 },
      );
    }
    lineItems.push({ price: setupPriceId, quantity: 1 });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: lineItems,
      payment_method_types: ["card"],
      locale: locale === "es" ? "es" : "auto",
      customer_email: booking.customer?.email || undefined,
      metadata: { bookingId },
      subscription_data: {
        metadata: { bookingId },
        description: "GoWash appliance rental",
      },
      success_url: `${appUrl}/book/${bookingId}?step=7&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/book/${bookingId}?step=6&canceled=true`,
    });

    log.info({ bookingId, sessionId: session.id }, "Checkout session created");

    return NextResponse.json({ sessionUrl: session.url });
  } catch (error) {
    log.error({ error, bookingId }, "Failed to create Stripe checkout session");
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 },
    );
  }
}
