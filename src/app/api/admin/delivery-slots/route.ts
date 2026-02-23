import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * GET /api/admin/delivery-slots
 *
 * List delivery slots with optional date filtering.
 * Protected by middleware (requires ADMIN or STAFF role).
 *
 * Query params: from, to, active (boolean)
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (from || to) {
    where.date = {};
    if (from) (where.date as Record<string, unknown>).gte = new Date(from);
    if (to) (where.date as Record<string, unknown>).lte = new Date(to);
  }
  if (active !== null && active !== "") {
    where.isActive = active === "true";
  }

  const slots = await prisma.deliverySlot.findMany({
    where,
    include: {
      _count: { select: { bookings: true } },
      slotHolds: {
        where: { released: false, expiresAt: { gt: new Date() } },
        select: { id: true },
      },
    },
    orderBy: [{ date: "asc" }, { windowStart: "asc" }],
  });

  return NextResponse.json({ slots });
}

/**
 * POST /api/admin/delivery-slots
 *
 * Create a new delivery slot.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { date: string; windowStart: string; windowEnd: string; windowLabel: string; capacity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.date || !body.windowStart || !body.windowEnd || !body.windowLabel) {
    return NextResponse.json({ error: "Missing required fields: date, windowStart, windowEnd, windowLabel" }, { status: 400 });
  }

  if (body.windowStart >= body.windowEnd) {
    return NextResponse.json({ error: "Start time must be before end time" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  try {
    const slot = await prisma.$transaction(async (tx) => {
      const created = await tx.deliverySlot.create({
        data: {
          date: new Date(body.date),
          windowStart: body.windowStart,
          windowEnd: body.windowEnd,
          windowLabel: body.windowLabel,
          capacity: body.capacity || 2,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "delivery_slot.create",
          targetId: created.id,
          details: { date: body.date, window: body.windowLabel },
          ip,
        },
      });
      return created;
    });

    return NextResponse.json({ slot }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "A slot with this date and time already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 });
  }
}
