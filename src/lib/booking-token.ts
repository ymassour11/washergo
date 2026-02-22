import jwt from "jsonwebtoken";
import { BOOKING_TOKEN_EXPIRY_HOURS } from "./config";

const SECRET = process.env.BOOKING_TOKEN_SECRET || "fallback-dev-secret";

interface BookingTokenPayload {
  bookingId: string;
  iat: number;
  exp: number;
}

/**
 * Create a signed JWT for accessing a specific booking.
 * Prevents enumeration attacks — you can't PATCH a booking without this token.
 */
export function createBookingToken(bookingId: string): string {
  return jwt.sign({ bookingId }, SECRET, {
    expiresIn: `${BOOKING_TOKEN_EXPIRY_HOURS}h`,
  });
}

/**
 * Verify and decode a booking access token.
 * Returns the bookingId if valid, null otherwise.
 */
export function verifyBookingToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, SECRET) as BookingTokenPayload;
    return decoded.bookingId;
  } catch {
    return null;
  }
}

/**
 * Cookie name used to store the booking access token.
 */
export const BOOKING_TOKEN_COOKIE = "booking_token";
