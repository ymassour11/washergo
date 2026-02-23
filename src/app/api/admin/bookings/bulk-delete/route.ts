import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/bookings/bulk-delete
 *
 * Permanently delete multiple bookings at once.
 * Only CANCELED or CLOSED bookings can be deleted.
 * Returns a summary of successes and failures.
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ route: "POST /api/admin/bookings/bulk-delete" });

  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.ids) || body.ids.length === 0) {
    return NextResponse.json({ error: "ids must be a non-empty array" }, { status: 400 });
  }

  if (body.ids.length > 100) {
    return NextResponse.json({ error: "Cannot delete more than 100 bookings at once" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const bookings = await prisma.booking.findMany({
    where: { id: { in: body.ids } },
    select: { id: true, status: true, customerId: true },
  });

  const deleted: string[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const booking of bookings) {
    if (!["CANCELED", "CLOSED"].includes(booking.status)) {
      skipped.push({ id: booking.id, reason: `Cannot delete: status is ${booking.status}` });
      continue;
    }

    try {
      await prisma.$transaction([
        prisma.slotHold.deleteMany({ where: { bookingId: booking.id } }),
        prisma.paymentRecord.deleteMany({ where: { bookingId: booking.id } }),
        prisma.assignment.deleteMany({ where: { bookingId: booking.id } }),
        prisma.booking.delete({ where: { id: booking.id } }),
        prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "booking.delete",
            targetId: booking.id,
            details: { status: booking.status, customerId: booking.customerId, bulk: true },
            ip,
          },
        }),
      ]);
      deleted.push(booking.id);
    } catch {
      skipped.push({ id: booking.id, reason: "Transaction failed" });
    }
  }

  // IDs that weren't found
  const foundIds = new Set(bookings.map((b) => b.id));
  for (const id of body.ids) {
    if (!foundIds.has(id)) {
      skipped.push({ id, reason: "Not found" });
    }
  }

  log.info({ userId: session.user.id, deleted: deleted.length, skipped: skipped.length }, "Bulk delete completed");

  return NextResponse.json({ deleted, skipped });
}
