import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/**
 * PATCH /api/admin/delivery-slots/[id]
 *
 * Update a delivery slot (toggle active, change capacity).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { isActive?: boolean; capacity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const slot = await prisma.deliverySlot.findUnique({ where: { id } });
  if (!slot) {
    return NextResponse.json({ error: "Slot not found" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const data: Record<string, unknown> = {};
  if (body.isActive !== undefined) data.isActive = body.isActive;
  if (body.capacity !== undefined) data.capacity = Math.max(0, body.capacity);

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.deliverySlot.update({ where: { id }, data });
    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "delivery_slot.update",
        targetId: id,
        details: { changes: JSON.parse(JSON.stringify(data)) },
        ip,
      },
    });
    return result;
  });

  return NextResponse.json({ slot: updated });
}
