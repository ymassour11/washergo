import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";

/**
 * POST /api/admin/portal-invites
 *
 * Generate a portal invite link for a customer after delivery.
 * Admin-only. The raw token goes in the URL; only its SHA-256 hash is stored.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const log = logger.child({ route: "POST /api/admin/portal-invites" });

  let body: { bookingId: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { bookingId } = body;
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
  }

  // Fetch booking with customer
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { customer: true },
  });

  if (!booking || !booking.customer) {
    return NextResponse.json({ error: "Booking or customer not found" }, { status: 404 });
  }

  if (!["ACTIVE", "PAST_DUE"].includes(booking.status)) {
    return NextResponse.json(
      { error: "Portal invites can only be sent for active bookings" },
      { status: 400 },
    );
  }

  const customerId = booking.customer.id;
  const customerEmail = booking.customer.email;

  // Check if customer already has a portal account
  const existingUser = await prisma.user.findUnique({
    where: { customerId },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "Customer already has a portal account" },
      { status: 409 },
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

  // Invalidate any existing unexpired invites (can't recover token from hash, so generate fresh)
  await prisma.portalInvite.updateMany({
    where: {
      customerId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });

  // Generate new invite
  const rawToken = randomUUID();
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");

  await prisma.portalInvite.create({
    data: {
      customerId,
      tokenHash,
      email: customerEmail,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "portal_invite.create",
      targetId: customerId,
      details: { bookingId, email: customerEmail },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    },
  });

  const inviteUrl = `${appUrl}/portal/register?token=${rawToken}`;
  log.info({ customerId, bookingId }, "Portal invite created");

  return NextResponse.json({ inviteUrl, email: customerEmail });
}
