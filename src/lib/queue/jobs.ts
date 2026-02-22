/**
 * Type-safe job payload definitions for all queues.
 */

export interface StripeWebhookJob {
  stripeEventId: string;
  eventType: string;
}

export interface NotificationJob {
  type: "booking_confirmation" | "payment_failed" | "subscription_canceled";
  bookingId: string;
  email?: string;
  phone?: string;
  data?: Record<string, unknown>;
}

export interface SlotReleaseJob {
  slotHoldId: string;
  bookingId: string;
  slotId: string;
}
