import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { logger } from "@/lib/logger";

/**
 * PATCH /api/admin/service-requests/[id]
 *
 * Update a service request's status, priority, or resolution.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const log = logger.child({ route: `PATCH /api/admin/service-requests/${id}` });
  const session = await auth();

  let body: { status?: string; priority?: string; resolution?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.serviceRequest.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Service request not found" }, { status: 404 });
  }

  const data: Record<string, unknown> = {};

  if (body.status) {
    const valid = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
    if (!valid.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = body.status;
    if (body.status === "RESOLVED") {
      data.resolvedAt = new Date();
    }
  }

  if (body.priority) {
    const valid = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    if (!valid.includes(body.priority)) {
      return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
    }
    data.priority = body.priority;
  }

  if (body.resolution !== undefined) {
    data.resolution = body.resolution || null;
  }

  const updated = await prisma.serviceRequest.update({
    where: { id },
    data,
  });

  // Audit log
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id || "unknown",
      action: "service_request.update",
      targetId: id,
      details: JSON.stringify({ changes: body, previousStatus: existing.status }),
      ip,
    },
  });

  log.info({ id, changes: body }, "Service request updated");

  return NextResponse.json({ serviceRequest: updated });
}
