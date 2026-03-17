import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";

/**
 * GET /api/portal/booking
 *
 * Fetch the customer's active booking with full details.
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
    include: {
      customer: true,
      deliverySlot: true,
      contractVersion: { select: { version: true, effectiveDate: true } },
      assignments: {
        include: { asset: { select: { type: true, model: true, serialNumber: true } } },
        where: { removedAt: null },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!booking) {
    return NextResponse.json({ booking: null });
  }

  return NextResponse.json({
    booking: {
      id: booking.id,
      status: booking.status,
      packageType: booking.packageType,
      termType: booking.termType,
      monthlyPriceCents: booking.monthlyPriceCents,
      setupFeeCents: booking.setupFeeCents,
      minimumTermMonths: booking.minimumTermMonths,
      addressLine1: booking.addressLine1,
      addressLine2: booking.addressLine2,
      city: booking.city,
      state: booking.state,
      zip: booking.zip,
      contractSignedAt: booking.contractSignedAt,
      createdAt: booking.createdAt,
      customer: booking.customer
        ? { name: booking.customer.name, email: booking.customer.email, phone: booking.customer.phone }
        : null,
      deliverySlot: booking.deliverySlot
        ? { date: booking.deliverySlot.date, windowLabel: booking.deliverySlot.windowLabel }
        : null,
      contractVersion: booking.contractVersion,
      assignments: booking.assignments.map((a) => ({
        id: a.id,
        installedAt: a.installedAt,
        asset: a.asset,
      })),
    },
  });
}
