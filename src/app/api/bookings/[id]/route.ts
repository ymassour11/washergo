import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBookingToken, BOOKING_TOKEN_COOKIE } from "@/lib/booking-token";
import { checkRateLimit, BOOKING_UPDATE_LIMIT } from "@/lib/rate-limit";
import { STEP_SCHEMAS } from "@/lib/validations";
import { STEP_RULES, canTransition, isAtLeast } from "@/lib/booking-machine";
import { PACKAGES, SLOT_HOLD_MINUTES, TERMS, getPricing } from "@/lib/config";
import { slotReleaseQueue } from "@/lib/queue/client";
import { logger } from "@/lib/logger";
import { PackageType, TermType, Prisma } from "@prisma/client";

/**
 * GET /api/bookings/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const token = req.cookies.get(BOOKING_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Missing booking token" }, { status: 401 });
  }

  const tokenBookingId = verifyBookingToken(token);
  if (tokenBookingId !== id) {
    return NextResponse.json({ error: "Invalid booking token" }, { status: 403 });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { customer: true, deliverySlot: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  } catch (error) {
    logger.error({ error, bookingId: id }, "Failed to fetch booking");
    return NextResponse.json({ error: "Failed to load booking" }, { status: 500 });
  }
}

/**
 * PATCH /api/bookings/[id]
 *
 * Body: { step: number, data: { ... } }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const log = logger.child({ route: `PATCH /api/bookings/${id}` });

  // Verify booking token
  const token = req.cookies.get(BOOKING_TOKEN_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ error: "Missing booking token" }, { status: 401 });
  }
  const tokenBookingId = verifyBookingToken(token);
  if (tokenBookingId !== id) {
    return NextResponse.json({ error: "Invalid booking token" }, { status: 403 });
  }

  // Rate limit
  const rateResult = checkRateLimit(`booking-update:${id}`, BOOKING_UPDATE_LIMIT);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateResult.retryAfterSeconds) } },
    );
  }

  let body: { step: number; data: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { step, data } = body;
  if (!step || !data) {
    return NextResponse.json({ error: "Missing step or data" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (["CANCELED", "CLOSED"].includes(booking.status)) {
    return NextResponse.json({ error: "Booking is no longer active" }, { status: 409 });
  }

  const stepRule = STEP_RULES[step];
  if (!stepRule) {
    return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  }

  if (!isAtLeast(booking.status, stepRule.requiredStatus)) {
    return NextResponse.json(
      { error: `Booking must be at least ${stepRule.requiredStatus} for step ${step}` },
      { status: 409 },
    );
  }

  // Validate step data
  const schema = STEP_SCHEMAS[step];
  if (schema) {
    const result = schema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join(".");
        if (!errors[field]) errors[field] = [];
        errors[field].push(issue.message);
      }
      return NextResponse.json({ error: "Validation failed", errors }, { status: 422 });
    }
  }

  try {
    let updated;

    switch (step) {
      case 1: {
        const newStatus = canTransition(booking.status, stepRule.completesTo)
          ? stepRule.completesTo
          : booking.status;
        updated = await prisma.booking.update({
          where: { id },
          data: {
            serviceZip: data.serviceZip as string,
            hasHookups: data.hasHookups as boolean,
            status: newStatus,
            currentStep: Math.max(booking.currentStep, 2),
          },
          include: { customer: true, deliverySlot: true },
        });
        break;
      }

      case 2: {
        // Two sub-operations:
        // A) packageType → save package, clear term/pricing, stay at step 2
        // B) termType → snapshot pricing from 2D matrix, advance to step 3
        if (data.packageType) {
          const pkgType = data.packageType as PackageType;
          if (!PACKAGES[pkgType]) {
            return NextResponse.json({ error: "Invalid package type" }, { status: 400 });
          }
          updated = await prisma.booking.update({
            where: { id },
            data: {
              packageType: pkgType,
              termType: null,
              monthlyPriceCents: null,
              setupFeeCents: null,
              minimumTermMonths: null,
              currentStep: Math.max(booking.currentStep, 2),
            },
            include: { customer: true, deliverySlot: true },
          });
        } else if (data.termType) {
          if (!booking.packageType) {
            return NextResponse.json(
              { error: "Must select a package before choosing a term" },
              { status: 400 },
            );
          }
          const termType = data.termType as TermType;
          if (!TERMS[termType]) {
            return NextResponse.json({ error: "Invalid term type" }, { status: 400 });
          }
          const pricing = getPricing(booking.packageType, termType);
          const termConfig = TERMS[termType];
          updated = await prisma.booking.update({
            where: { id },
            data: {
              termType,
              monthlyPriceCents: pricing.monthlyPriceCents,
              setupFeeCents: pricing.setupFeeCents,
              minimumTermMonths: termConfig.minimumTermMonths,
              currentStep: Math.max(booking.currentStep, 3),
            },
            include: { customer: true, deliverySlot: true },
          });
        } else {
          return NextResponse.json(
            { error: "Must provide packageType or termType" },
            { status: 400 },
          );
        }
        break;
      }

      case 3: {
        // Create or update customer
        const customerData = {
          name: data.customerName as string,
          email: data.customerEmail as string,
          phone: data.customerPhone as string,
        };

        let custId = booking.customerId;
        if (custId) {
          await prisma.customer.update({ where: { id: custId }, data: customerData });
        } else {
          const cust = await prisma.customer.create({ data: customerData });
          custId = cust.id;
        }

        updated = await prisma.booking.update({
          where: { id },
          data: {
            customer: { connect: { id: custId } },
            addressLine1: data.addressLine1 as string,
            addressLine2: (data.addressLine2 as string) || "",
            city: data.city as string,
            state: data.state as string,
            zip: data.zip as string,
            floor: data.floor ? Number(data.floor) : null,
            hasElevator: (data.hasElevator as boolean) || false,
            gateCode: (data.gateCode as string) || "",
            entryNotes: (data.entryNotes as string) || "",
            deliveryNotes: (data.deliveryNotes as string) || "",
            currentStep: Math.max(booking.currentStep, 4),
          },
          include: { customer: true, deliverySlot: true },
        });
        break;
      }

      case 4: {
        updated = await prisma.booking.update({
          where: { id },
          data: {
            dryerPlugType: data.dryerPlugType as "THREE_PRONG" | "FOUR_PRONG",
            hasHotColdValves: data.hasHotColdValves as boolean,
            hasDrainAccess: data.hasDrainAccess as boolean,
            currentStep: Math.max(booking.currentStep, 5),
          },
          include: { customer: true, deliverySlot: true },
        });
        break;
      }

      case 5: {
        // Delivery slot with capacity enforcement using serializable transaction
        const slotId = data.deliverySlotId as string;

        const hold = await prisma.$transaction(
          async (tx) => {
            const slot = await tx.deliverySlot.findUnique({ where: { id: slotId } });
            if (!slot || !slot.isActive) throw new Error("SLOT_NOT_FOUND");

            const bookedCount = await tx.booking.count({
              where: {
                deliverySlotId: slotId,
                id: { not: booking.id },
                status: { notIn: ["CANCELED", "CLOSED", "DRAFT"] },
              },
            });

            const holdCount = await tx.slotHold.count({
              where: {
                slotId,
                released: false,
                expiresAt: { gt: new Date() },
                bookingId: { not: booking.id },
              },
            });

            if (bookedCount + holdCount >= slot.capacity) throw new Error("SLOT_FULL");

            // Release existing holds for this booking
            await tx.slotHold.updateMany({
              where: { bookingId: booking.id, released: false },
              data: { released: true },
            });

            return tx.slotHold.create({
              data: {
                bookingId: booking.id,
                slotId,
                expiresAt: new Date(Date.now() + SLOT_HOLD_MINUTES * 60 * 1000),
              },
            });
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            timeout: 10000,
          },
        );

        // Schedule slot release
        await slotReleaseQueue.add(
          `release-${hold.id}`,
          { slotHoldId: hold.id, bookingId: booking.id, slotId },
          { delay: SLOT_HOLD_MINUTES * 60 * 1000 },
        );

        const newStatus = canTransition(booking.status, "SCHEDULED")
          ? "SCHEDULED"
          : booking.status;

        updated = await prisma.booking.update({
          where: { id },
          data: {
            deliverySlot: { connect: { id: slotId } },
            status: newStatus,
            currentStep: Math.max(booking.currentStep, 6),
          },
          include: { customer: true, deliverySlot: true },
        });
        break;
      }

      case 6: {
        // Step 6 records consent; payment is via Stripe redirect
        updated = await prisma.booking.update({
          where: { id },
          data: { currentStep: Math.max(booking.currentStep, 6) },
          include: { customer: true, deliverySlot: true },
        });
        break;
      }

      case 7: {
        const latestContract = await prisma.contractVersion.findFirst({
          orderBy: { effectiveDate: "desc" },
        });
        if (!latestContract) {
          return NextResponse.json({ error: "No contract version available" }, { status: 500 });
        }

        const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
        const userAgent = req.headers.get("user-agent") || "unknown";

        const newStatus = canTransition(booking.status, "CONTRACT_SIGNED")
          ? "CONTRACT_SIGNED"
          : booking.status;

        updated = await prisma.booking.update({
          where: { id },
          data: {
            contractVersion: { connect: { id: latestContract.id } },
            contractSignedAt: new Date(),
            contractSignerName: data.signerName as string,
            contractSignerIp: ip,
            contractSignerAgent: userAgent,
            status: newStatus,
            currentStep: 8,
          },
          include: { customer: true, deliverySlot: true },
        });
        break;
      }

      default:
        return NextResponse.json({ error: "Invalid step" }, { status: 400 });
    }

    log.info({ bookingId: id, step, status: updated.status }, "Booking step saved");
    return NextResponse.json({ booking: updated });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "SLOT_NOT_FOUND") {
        return NextResponse.json({ error: "Delivery slot not found or unavailable" }, { status: 404 });
      }
      if (error.message === "SLOT_FULL") {
        return NextResponse.json({ error: "This delivery slot is full. Please select another." }, { status: 409 });
      }
    }
    log.error({ error, step }, "Failed to update booking");
    return NextResponse.json({ error: "Failed to save booking data" }, { status: 500 });
  }
}
