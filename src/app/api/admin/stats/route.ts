import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/stats
 *
 * Dashboard KPIs: booking counts by status, revenue, upcoming deliveries.
 * Protected by middleware (requires ADMIN or STAFF role).
 */
export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    statusCounts,
    totalCustomers,
    revenueThisMonth,
    upcomingDeliveries,
    recentLogs,
    totalAssets,
    assetsByStatus,
  ] = await Promise.all([
    // Booking counts by status
    prisma.booking.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
    // Total customers
    prisma.customer.count(),
    // Revenue this month
    prisma.paymentRecord.aggregate({
      where: {
        status: "paid",
        paidAt: { gte: startOfMonth },
      },
      _sum: { amountCents: true },
    }),
    // Upcoming deliveries (next 7 days)
    prisma.booking.count({
      where: {
        status: { in: ["CONTRACT_SIGNED", "PAID_SETUP"] },
        deliverySlot: {
          date: { gte: now, lte: nextWeek },
        },
      },
    }),
    // Recent audit logs
    prisma.auditLog.findMany({
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Total assets
    prisma.asset.count(),
    // Assets by status
    prisma.asset.groupBy({
      by: ["status"],
      _count: { id: true },
    }),
  ]);

  const statusMap: Record<string, number> = {};
  let totalBookings = 0;
  for (const row of statusCounts) {
    statusMap[row.status] = row._count.id;
    totalBookings += row._count.id;
  }

  const assetStatusMap: Record<string, number> = {};
  for (const row of assetsByStatus) {
    assetStatusMap[row.status] = row._count.id;
  }

  return NextResponse.json({
    bookings: {
      total: totalBookings,
      byStatus: statusMap,
      active: statusMap.ACTIVE || 0,
      pastDue: statusMap.PAST_DUE || 0,
    },
    customers: { total: totalCustomers },
    revenue: {
      thisMonthCents: revenueThisMonth._sum.amountCents || 0,
    },
    upcomingDeliveries,
    assets: {
      total: totalAssets,
      byStatus: assetStatusMap,
    },
    recentActivity: recentLogs,
  });
}
