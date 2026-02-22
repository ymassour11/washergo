import { Job } from "bullmq";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { SlotReleaseJob } from "@/lib/queue/jobs";

/**
 * Release a delivery slot hold after timeout.
 *
 * Fired as a delayed job when a hold is created.
 * Only releases if the booking hasn't progressed past payment.
 */
export async function releaseSlotHold(job: Job<SlotReleaseJob>) {
  const { slotHoldId, bookingId, slotId } = job.data;
  const log = logger.child({ jobId: job.id, slotHoldId, bookingId });

  const hold = await prisma.slotHold.findUnique({
    where: { id: slotHoldId },
  });

  if (!hold) {
    log.info("Slot hold not found, already cleaned up");
    return;
  }

  if (hold.released) {
    log.info("Slot hold already released");
    return;
  }

  // Check if booking has progressed past SCHEDULED (payment successful)
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { status: true },
  });

  if (
    booking &&
    ["PAID_SETUP", "CONTRACT_SIGNED", "ACTIVE"].includes(booking.status)
  ) {
    // Booking progressed — mark hold as released (slot is permanently claimed)
    await prisma.slotHold.update({
      where: { id: slotHoldId },
      data: { released: true },
    });
    log.info("Booking progressed past payment, hold released (slot kept)");
    return;
  }

  // Booking hasn't progressed — release the hold and clear the slot from booking
  await prisma.$transaction([
    prisma.slotHold.update({
      where: { id: slotHoldId },
      data: { released: true },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { deliverySlotId: null },
    }),
  ]);

  log.info({ slotId }, "Slot hold released — booking did not complete payment in time");
}
