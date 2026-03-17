import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPortalSession } from "@/lib/portal-auth";
import { z } from "zod";

const createSchema = z.object({
  category: z.enum(
    ["MAINTENANCE", "BILLING", "MOVE_REQUEST", "CANCELLATION", "OTHER"],
    "Please select a category",
  ),
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
});

/**
 * GET /api/portal/service-requests
 *
 * List the customer's service requests.
 */
export async function GET() {
  const portal = await getPortalSession();
  if (!portal) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the customer's active booking
  const booking = await prisma.booking.findFirst({
    where: {
      customerId: portal.customerId,
      status: { in: ["ACTIVE", "PAST_DUE", "CONTRACT_SIGNED", "PAID_SETUP"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!booking) {
    return NextResponse.json({ requests: [] });
  }

  const requests = await prisma.serviceRequest.findMany({
    where: { bookingId: booking.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    requests: requests.map((r) => ({
      id: r.id,
      category: r.category,
      status: r.status,
      priority: r.priority,
      title: r.title,
      description: r.description,
      resolution: r.resolution,
      resolvedAt: r.resolvedAt,
      createdAt: r.createdAt,
    })),
  });
}

/**
 * POST /api/portal/service-requests
 *
 * Create a new service request.
 */
export async function POST(req: NextRequest) {
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

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Validation error" },
      { status: 400 },
    );
  }

  const { category, title, description } = parsed.data;

  // Find active booking
  const booking = await prisma.booking.findFirst({
    where: {
      customerId: portal.customerId,
      status: { in: ["ACTIVE", "PAST_DUE", "CONTRACT_SIGNED", "PAID_SETUP"] },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!booking) {
    return NextResponse.json(
      { error: "No active booking found" },
      { status: 400 },
    );
  }

  const serviceRequest = await prisma.serviceRequest.create({
    data: {
      bookingId: booking.id,
      customerId: portal.customerId,
      category,
      title,
      description,
      status: "OPEN",
      priority: category === "CANCELLATION" ? "HIGH" : "MEDIUM",
    },
  });

  return NextResponse.json({ serviceRequest }, { status: 201 });
}
