import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBookingToken } from "@/lib/booking-token";

/**
 * GET /api/pay/[bookingId]?token=xxx
 *
 * Fetches booking details for the delivery-payment page.
 * Authenticated via signed JWT token in query string.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }

  const tokenBookingId = verifyBookingToken(token);
  if (tokenBookingId !== bookingId) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true, deliverySlot: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!booking.payAtDelivery) {
    return NextResponse.json({ error: "This booking is not pay-at-delivery" }, { status: 400 });
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
      contractSignedAt: booking.contractSignedAt,
      contractSignerName: booking.contractSignerName,
      stripeSubscriptionId: booking.stripeSubscriptionId,
      addressLine1: booking.addressLine1,
      addressLine2: booking.addressLine2,
      city: booking.city,
      state: booking.state,
      zip: booking.zip,
      customer: booking.customer
        ? {
            name: booking.customer.name,
            email: booking.customer.email,
            phone: booking.customer.phone,
          }
        : null,
      deliverySlot: booking.deliverySlot
        ? {
            date: booking.deliverySlot.date,
            windowLabel: booking.deliverySlot.windowLabel,
          }
        : null,
    },
  });
}
