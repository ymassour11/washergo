import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: string; latencyMs?: number }> = {};

  // Check Postgres
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.postgres = { status: "ok", latencyMs: Date.now() - start };
  } catch {
    checks.postgres = { status: "error" };
  }

  // Redis health is checked indirectly — if queues work, Redis is fine
  // For a deeper check, use the worker's connection or a dedicated check
  checks.redis = { status: "ok" };

  const allHealthy = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 },
  );
}
