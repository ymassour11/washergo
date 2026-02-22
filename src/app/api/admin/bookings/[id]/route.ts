import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { assertTransition } from "@/lib/booking-machine";
import { logger } from "@/lib/logger";
import { BookingStatus } from "@prisma/client";

/**
 * GET /api/admin/bookings/[id]
 *
 * Get full booking details for admin view.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      customer: true,
      deliverySlot: true,
      contractVersion: true,
      paymentRecords: { orderBy: { createdAt: "desc" } },
      assignments: { include: { asset: true } },
      slotHolds: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}

/**
 * PATCH /api/admin/bookings/[id]
 *
 * Admin actions on a booking:
 * - Mark as ACTIVE (delivered)
 * - Cancel
 * - Update notes
 * - Close
 *
 * All actions are audit-logged.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const log = logger.child({ route: `PATCH /api/admin/bookings/${id}` });

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  try {
    switch (body.action) {
      case "mark_active": {
        assertTransition(booking.status, "ACTIVE");
        await prisma.$transaction([
          prisma.booking.update({
            where: { id },
            data: { status: "ACTIVE" },
          }),
          prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: "booking.mark_active",
              targetId: id,
              details: { previousStatus: booking.status },
              ip,
            },
          }),
        ]);
        log.info({ bookingId: id, userId: session.user.id }, "Booking marked ACTIVE");
        break;
      }

      case "cancel": {
        assertTransition(booking.status, "CANCELED");
        await prisma.$transaction([
          prisma.booking.update({
            where: { id },
            data: { status: "CANCELED" },
          }),
          // Release any active slot holds
          prisma.slotHold.updateMany({
            where: { bookingId: id, released: false },
            data: { released: true },
          }),
          prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: "booking.cancel",
              targetId: id,
              details: { previousStatus: booking.status, reason: body.notes },
              ip,
            },
          }),
        ]);
        log.info({ bookingId: id, userId: session.user.id }, "Booking canceled");
        break;
      }

      case "close": {
        assertTransition(booking.status, "CLOSED");
        await prisma.$transaction([
          prisma.booking.update({
            where: { id },
            data: { status: "CLOSED" },
          }),
          prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: "booking.close",
              targetId: id,
              details: { previousStatus: booking.status },
              ip,
            },
          }),
        ]);
        log.info({ bookingId: id, userId: session.user.id }, "Booking closed");
        break;
      }

      case "update_notes": {
        await prisma.$transaction([
          prisma.booking.update({
            where: { id },
            data: { adminNotes: body.notes || "" },
          }),
          prisma.auditLog.create({
            data: {
              userId: session.user.id,
              action: "booking.update_notes",
              targetId: id,
              ip,
            },
          }),
        ]);
        break;
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    const updated = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, deliverySlot: true },
    });

    return NextResponse.json({ booking: updated });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Invalid booking status transition")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    log.error({ error }, "Failed to update booking");
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
