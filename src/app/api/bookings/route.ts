import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBookingToken, BOOKING_TOKEN_COOKIE } from "@/lib/booking-token";
import { checkRateLimit, BOOKING_CREATE_LIMIT } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

/**
 * POST /api/bookings
 *
 * Creates a new DRAFT booking.
 * Returns bookingId + sets signed access token cookie.
 * Rate-limited: 5 per IP per 10 minutes.
 */
export async function POST(req: NextRequest) {
  const log = logger.child({ route: "POST /api/bookings" });

  // Rate limit by IP
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rateResult = checkRateLimit(`booking-create:${ip}`, BOOKING_CREATE_LIMIT);

  if (!rateResult.allowed) {
    log.warn({ ip }, "Rate limit exceeded for booking creation");
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateResult.retryAfterSeconds) },
      },
    );
  }

  try {
    const booking = await prisma.booking.create({
      data: {
        status: "DRAFT",
        currentStep: 1,
      },
    });

    const token = createBookingToken(booking.id);

    log.info({ bookingId: booking.id }, "Booking created");

    const response = NextResponse.json(
      { bookingId: booking.id },
      { status: 201 },
    );

    // Set httpOnly cookie for booking access
    response.cookies.set(BOOKING_TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error) {
    log.error({ error }, "Failed to create booking");
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 },
    );
  }
}
