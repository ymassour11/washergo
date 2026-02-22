import { describe, it, expect } from "vitest";
import { createBookingToken, verifyBookingToken } from "@/lib/booking-token";

describe("booking tokens", () => {
  it("creates and verifies a valid token", () => {
    const bookingId = "test-booking-123";
    const token = createBookingToken(bookingId);
    expect(typeof token).toBe("string");

    const result = verifyBookingToken(token);
    expect(result).toBe(bookingId);
  });

  it("returns null for invalid token", () => {
    expect(verifyBookingToken("garbage")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(verifyBookingToken("")).toBeNull();
  });

  it("different bookingIds produce different tokens", () => {
    const t1 = createBookingToken("booking-1");
    const t2 = createBookingToken("booking-2");
    expect(t1).not.toBe(t2);
  });
});
