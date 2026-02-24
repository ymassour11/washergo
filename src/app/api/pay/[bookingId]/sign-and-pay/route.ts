import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { verifyBookingToken } from "@/lib/booking-token";
import { getPricing } from "@/lib/config";
import { logger } from "@/lib/logger";
import type { TermType, PackageType } from "@prisma/client";
import type Stripe from "stripe";

/**
 * POST /api/pay/[bookingId]/sign-and-pay
 *
 * Signs the rental contract and creates a Stripe Checkout session.
 * Used by the delivery-person payment page.
 *
 * Body: { token: string, signerName: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;
  const log = logger.child({ route: `POST /api/pay/${bookingId}/sign-and-pay` });

  let body: { token: string; signerName: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, signerName } = body;

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const tokenBookingId = verifyBookingToken(token);
  if (tokenBookingId !== bookingId) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  if (!signerName || signerName.trim().length < 2) {
    return NextResponse.json({ error: "Signer name is required (min 2 characters)" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.stripeSubscriptionId) {
    return NextResponse.json({ error: "Payment already collected" }, { status: 409 });
  }

  if (!booking.packageType || !booking.termType) {
    return NextResponse.json({ error: "Booking is missing package or term" }, { status: 400 });
  }

  // Save contract signature
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  // Get the latest contract version
  const contractVersion = await prisma.contractVersion.findFirst({
    orderBy: { effectiveDate: "desc" },
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      contractSignedAt: new Date(),
      contractSignerName: signerName.trim(),
      contractSignerIp: ip,
      contractSignerAgent: userAgent,
      ...(contractVersion ? { contractVersionId: contractVersion.id } : {}),
    },
  });

  log.info({ bookingId, signerName: signerName.trim() }, "Contract signed via delivery payment page");

  // Create Stripe checkout session
  const pricing = getPricing(
    booking.packageType as PackageType,
    booking.termType as TermType,
  );
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

  const monthlyPriceId = process.env[pricing.stripeMonthlyPriceIdEnvKey]?.trim();
  if (!monthlyPriceId) {
    log.error({ envKey: pricing.stripeMonthlyPriceIdEnvKey }, "Monthly Stripe price ID not configured");
    return NextResponse.json({ error: "Payment configuration error" }, { status: 500 });
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    { price: monthlyPriceId, quantity: 1 },
  ];

  if (pricing.setupFeeCents > 0 && pricing.stripeSetupPriceIdEnvKey) {
    const setupPriceId = process.env[pricing.stripeSetupPriceIdEnvKey]?.trim();
    if (!setupPriceId) {
      log.error({ envKey: pricing.stripeSetupPriceIdEnvKey }, "Setup fee Stripe price ID not configured");
      return NextResponse.json({ error: "Payment configuration error" }, { status: 500 });
    }
    lineItems.push({ price: setupPriceId, quantity: 1 });
  }

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: lineItems,
      payment_method_types: ["card"],
      customer_email: booking.customer?.email || undefined,
      metadata: { bookingId },
      subscription_data: {
        metadata: { bookingId },
        description: "GoWash appliance rental",
      },
      success_url: `${appUrl}/pay/success?booking_id=${bookingId}`,
      cancel_url: `${appUrl}/pay/${bookingId}?token=${token}&canceled=true`,
    });

    log.info({ bookingId, sessionId: checkoutSession.id }, "Stripe checkout created after contract signing");

    return NextResponse.json({ sessionUrl: checkoutSession.url });
  } catch (error) {
    log.error({ error, bookingId }, "Failed to create Stripe checkout");
    return NextResponse.json({ error: "Failed to create payment session" }, { status: 500 });
  }
}
