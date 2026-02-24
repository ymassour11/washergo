import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { createBookingToken } from "@/lib/booking-token";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/bookings/[id]/payment-link
 *
 * Generates a signed URL for the delivery-payment page.
 * The delivery person opens this link → signs the contract → pays via Stripe.
 *
 * Requires admin session auth.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const log = logger.child({ route: `POST /api/admin/bookings/${id}/payment-link` });

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (!booking.payAtDelivery) {
    return NextResponse.json(
      { error: "This booking did not select pay-at-delivery" },
      { status: 400 },
    );
  }

  if (booking.stripeSubscriptionId) {
    return NextResponse.json(
      { error: "Payment has already been collected for this booking" },
      { status: 409 },
    );
  }

  if (!booking.packageType || !booking.termType) {
    return NextResponse.json(
      { error: "Booking is missing package or term selection" },
      { status: 400 },
    );
  }

  // Generate a signed token for the delivery payment page
  const token = createBookingToken(id);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();
  const paymentUrl = `${appUrl}/pay/${id}?token=${token}`;

  log.info(
    { bookingId: id, userId: session.user.id },
    "Payment link generated for pay-at-delivery booking",
  );

  return NextResponse.json({ paymentUrl });
}
