import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";

/**
 * GET /api/portal/billing
 *
 * Fetch payment records for the customer's active booking.
 */
export async function GET() {
  const portal = await getPortalSession();
  if (!portal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findFirst({
    where: {
      customerId: portal.customerId,
      status: { in: ["ACTIVE", "PAST_DUE", "CONTRACT_SIGNED", "PAID_SETUP"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!booking) {
    return NextResponse.json({ booking: null, payments: [] });
  }

  const payments = await prisma.paymentRecord.findMany({
    where: { bookingId: booking.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    booking: {
      id: booking.id,
      status: booking.status,
      packageType: booking.packageType,
      termType: booking.termType,
      monthlyPriceCents: booking.monthlyPriceCents,
      canManageBilling: true,
    },
    payments: payments.map((p) => ({
      id: p.id,
      amountCents: p.amountCents,
      currency: p.currency,
      status: p.status,
      description: p.description,
      invoicePdfUrl: p.invoicePdfUrl,
      hostedInvoiceUrl: p.hostedInvoiceUrl,
      paidAt: p.paidAt,
      createdAt: p.createdAt,
    })),
  });
}
