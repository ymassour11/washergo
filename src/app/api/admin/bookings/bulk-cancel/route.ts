import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canTransition } from "@/lib/booking-machine";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/bookings/bulk-cancel
 *
 * Cancel multiple bookings at once.
 * Only bookings that can legally transition to CANCELED are processed.
 * Returns a summary of successes and failures.
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ route: "POST /api/admin/bookings/bulk-cancel" });

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
    return NextResponse.json({ error: "Cannot cancel more than 100 bookings at once" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  const bookings = await prisma.booking.findMany({
    where: { id: { in: body.ids } },
    select: { id: true, status: true },
  });

  const canceled: string[] = [];
  const skipped: Array<{ id: string; reason: string }> = [];

  for (const booking of bookings) {
    if (!canTransition(booking.status, "CANCELED")) {
      skipped.push({ id: booking.id, reason: `Cannot cancel from ${booking.status}` });
      continue;
    }

    try {
      await prisma.$transaction([
        prisma.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELED" },
        }),
        prisma.slotHold.updateMany({
          where: { bookingId: booking.id, released: false },
          data: { released: true },
        }),
        prisma.auditLog.create({
          data: {
            userId: session.user.id,
            action: "booking.cancel",
            targetId: booking.id,
            details: { previousStatus: booking.status, bulk: true },
            ip,
          },
        }),
      ]);
      canceled.push(booking.id);
    } catch {
      skipped.push({ id: booking.id, reason: "Transaction failed" });
    }
  }

  // IDs that weren't found in the database
  const foundIds = new Set(bookings.map((b) => b.id));
  for (const id of body.ids) {
    if (!foundIds.has(id)) {
      skipped.push({ id, reason: "Not found" });
    }
  }

  log.info({ userId: session.user.id, canceled: canceled.length, skipped: skipped.length }, "Bulk cancel completed");

  return NextResponse.json({ canceled, skipped });
}
