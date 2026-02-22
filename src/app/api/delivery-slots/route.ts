import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/delivery-slots
 *
 * Returns available delivery slots with remaining capacity.
 */
export async function GET() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const slots = await prisma.deliverySlot.findMany({
    where: {
      isActive: true,
      date: { gte: now },
    },
    orderBy: [{ date: "asc" }, { windowStart: "asc" }],
  });

  // Calculate remaining capacity for each slot
  const slotsWithCapacity = await Promise.all(
    slots.map(async (slot) => {
      const bookedCount = await prisma.booking.count({
        where: {
          deliverySlotId: slot.id,
          status: { notIn: ["CANCELED", "CLOSED", "DRAFT"] },
        },
      });

      const holdCount = await prisma.slotHold.count({
        where: {
          slotId: slot.id,
          released: false,
          expiresAt: { gt: new Date() },
        },
      });

      const remaining = slot.capacity - bookedCount - holdCount;

      return {
        id: slot.id,
        date: slot.date,
        windowLabel: slot.windowLabel,
        windowStart: slot.windowStart,
        windowEnd: slot.windowEnd,
        available: remaining > 0,
        remaining: Math.max(0, remaining),
      };
    }),
  );

  return NextResponse.json({ slots: slotsWithCapacity });
}
