import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, PORTAL_REGISTER_LIMIT } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * POST /api/portal/register
 *
 * Public endpoint — validates an invite token and creates a CUSTOMER user account.
 * Rate-limited by IP.
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ route: "POST /api/portal/register" });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  // Rate limit
  const rl = await checkRateLimit(`portal-register:${ip}`, PORTAL_REGISTER_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds || 60) } },
    );
  }

  let body: { token: string; password: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, password, name } = body;

  if (!token) {
    return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  // Hash the incoming token and look up the invite
  const tokenHash = createHash("sha256").update(token).digest("hex");

  const invite = await prisma.portalInvite.findUnique({
    where: { tokenHash },
    include: { customer: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite link" }, { status: 400 });
  }

  if (invite.usedAt) {
    return NextResponse.json(
      { error: "This invite has already been used. Please log in instead." },
      { status: 400 },
    );
  }

  if (invite.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This invite has expired. Please contact support for a new one." },
      { status: 400 },
    );
  }

  // Check if customer already has an account (double-guard)
  const existingUser = await prisma.user.findUnique({
    where: { customerId: invite.customerId },
  });
  if (existingUser) {
    return NextResponse.json(
      { error: "An account already exists for this customer. Please log in." },
      { status: 409 },
    );
  }

  // Check email collision with non-customer users
  const emailUser = await prisma.user.findUnique({
    where: { email: invite.customer.email },
  });
  if (emailUser) {
    return NextResponse.json(
      { error: "This email is already associated with another account. Please contact support." },
      { status: 409 },
    );
  }

  // Create the customer user account
  const passwordHash = await hash(password, 12);

  try {
    await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invite.customer.email,
          name: name?.trim() || invite.customer.name,
          passwordHash,
          role: "CUSTOMER",
          customerId: invite.customerId,
        },
      }),
      prisma.portalInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      }),
    ]);
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "An account already exists for this customer. Please log in." },
        { status: 409 },
      );
    }
    throw error;
  }

  log.info({ customerId: invite.customerId }, "Portal account created");

  return NextResponse.json({ success: true });
}
