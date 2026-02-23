import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AssetStatus, AssetCondition } from "@prisma/client";

/**
 * PATCH /api/admin/assets/[id]
 *
 * Update asset status, condition, or notes.
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

  let body: { status?: string; condition?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const asset = await prisma.asset.findUnique({ where: { id } });
  if (!asset) {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const data: Record<string, unknown> = {};
  if (body.status && ["AVAILABLE", "ASSIGNED", "MAINTENANCE", "RETIRED"].includes(body.status)) {
    data.status = body.status as AssetStatus;
  }
  if (body.condition && ["NEW", "GOOD", "FAIR", "POOR"].includes(body.condition)) {
    data.condition = body.condition as AssetCondition;
  }
  if (body.notes !== undefined) {
    data.notes = body.notes || null;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.asset.update({ where: { id }, data });
    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "asset.update",
        targetId: id,
        details: { previousStatus: asset.status, changes: JSON.parse(JSON.stringify(data)) },
        ip,
      },
    });
    return result;
  });

  return NextResponse.json({ asset: updated });
}
