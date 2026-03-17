import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(20).optional(),
});

/**
 * GET /api/portal/account
 *
 * Fetch the customer's profile info.
 */
export async function GET() {
  const portal = await getPortalSession();
  if (!portal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: portal.customerId },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
  });
}

/**
 * PATCH /api/portal/account
 *
 * Update name and/or phone on the customer record.
 */
export async function PATCH(req: NextRequest) {
  const portal = await getPortalSession();
  if (!portal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Validation error" },
      { status: 400 },
    );
  }

  const data: Record<string, string> = {};
  if (parsed.data.name) data.name = parsed.data.name.trim();
  if (parsed.data.phone) data.phone = parsed.data.phone.trim();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const customer = await prisma.$transaction(async (tx) => {
    const updated = await tx.customer.update({ where: { id: portal.customerId }, data });
    if (data.name) {
      await tx.user.update({ where: { customerId: portal.customerId }, data: { name: data.name } });
    }
    return updated;
  });

  return NextResponse.json({
    profile: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
    },
  });
}
