import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ServiceRequestStatus, ServiceRequestCategory, ServiceRequestPriority } from "@prisma/client";

/**
 * GET /api/admin/service-requests
 *
 * List all service requests with filtering and search.
 * Protected by middleware (requires ADMIN or STAFF role).
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const status = searchParams.get("status") as ServiceRequestStatus | null;
  const category = searchParams.get("category") as ServiceRequestCategory | null;
  const priority = searchParams.get("priority") as ServiceRequestPriority | null;
  const search = searchParams.get("search")?.trim() || "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 25));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { booking: { customer: { name: { contains: search, mode: "insensitive" } } } },
      { booking: { customer: { email: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [requests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            customer: { select: { name: true, email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return NextResponse.json({
    requests,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
