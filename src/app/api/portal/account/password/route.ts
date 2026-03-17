import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";
import { checkRateLimit, ADMIN_LOGIN_LIMIT } from "@/lib/rate-limit";

/**
 * POST /api/portal/account/password
 *
 * Change the customer's password.
 */
export async function POST(req: NextRequest) {
  const portal = await getPortalSession();
  if (!portal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limit password change attempts
  const rl = await checkRateLimit(`portal-password:${portal.userId}`, ADMIN_LOGIN_LIMIT);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds || 60) } },
    );
  }

  let body: { currentPassword: string; newPassword: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current and new passwords are required" },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: portal.userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isValid = await compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const passwordHash = await hash(newPassword, 12);
  await prisma.user.update({
    where: { id: portal.userId },
    data: { passwordHash },
  });

  return NextResponse.json({ success: true });
}
