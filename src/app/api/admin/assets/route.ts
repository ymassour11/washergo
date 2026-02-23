import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { AssetType, AssetCondition } from "@prisma/client";

/**
 * GET /api/admin/assets
 *
 * List assets with optional status/type filtering.
 * Protected by middleware (requires ADMIN or STAFF role).
 *
 * Query params: status, type, search
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status");
  const type = searchParams.get("type");
  const search = searchParams.get("search")?.trim() || "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { serialNumber: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
    ];
  }

  const assets = await prisma.asset.findMany({
    where,
    include: {
      assignments: {
        where: { removedAt: null },
        include: {
          booking: {
            select: { id: true, status: true, customer: { select: { name: true } } },
          },
        },
      },
      _count: { select: { maintenanceLogs: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ assets });
}

/**
 * POST /api/admin/assets
 *
 * Create a new asset.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { type: string; serialNumber: string; model: string; condition?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.type || !body.serialNumber || !body.model) {
    return NextResponse.json({ error: "Missing required fields: type, serialNumber, model" }, { status: 400 });
  }

  if (!["WASHER", "DRYER"].includes(body.type)) {
    return NextResponse.json({ error: "Invalid type. Must be WASHER or DRYER" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  try {
    const asset = await prisma.$transaction(async (tx) => {
      const created = await tx.asset.create({
        data: {
          type: body.type as AssetType,
          serialNumber: body.serialNumber.trim(),
          model: body.model.trim(),
          condition: (body.condition as AssetCondition) || "NEW",
          notes: body.notes || null,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "asset.create",
          targetId: created.id,
          details: { type: body.type, serialNumber: body.serialNumber, model: body.model },
          ip,
        },
      });
      return created;
    });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "An asset with this serial number already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create asset" }, { status: 500 });
  }
}
