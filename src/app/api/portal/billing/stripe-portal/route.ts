import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getPortalSession } from "@/lib/portal-auth";
import { logger } from "@/lib/logger";

/**
 * POST /api/portal/billing/stripe-portal
 *
 * Create a Stripe Customer Portal session for the customer to manage
 * their payment method, view invoices, etc.
 */
export async function POST() {
  const portal = await getPortalSession();
  if (!portal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = logger.child({ route: "POST /api/portal/billing/stripe-portal" });

  // Get stripeCustomerId from our DB (never from request)
  const booking = await prisma.booking.findFirst({
    where: {
      customerId: portal.customerId,
      status: { in: ["ACTIVE", "PAST_DUE", "CONTRACT_SIGNED", "PAID_SETUP"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "No active booking found" },
      { status: 400 },
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

  try {
    // Auto-create Stripe customer if one doesn't exist yet (e.g. pay-at-delivery customers)
    let stripeCustomerId = booking.stripeCustomerId;
    if (!stripeCustomerId || !stripeCustomerId.startsWith("cus_")) {
      const customer = await prisma.customer.findUnique({
        where: { id: portal.customerId },
      });
      const stripeCustomer = await stripe.customers.create({
        email: customer?.email || undefined,
        name: customer?.name || undefined,
        phone: customer?.phone || undefined,
        metadata: { bookingId: booking.id, customerId: portal.customerId },
      });
      stripeCustomerId = stripeCustomer.id;
      await prisma.booking.update({
        where: { id: booking.id },
        data: { stripeCustomerId },
      });
      log.info(
        { customerId: portal.customerId, stripeCustomerId },
        "Auto-created Stripe customer for portal billing",
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/portal/billing`,
    });

    log.info(
      { customerId: portal.customerId, stripeCustomerId: booking.stripeCustomerId },
      "Stripe billing portal session created",
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    log.error({ error }, "Failed to create Stripe billing portal session");
    return NextResponse.json(
      { error: "Failed to open billing portal" },
      { status: 500 },
    );
  }
}
