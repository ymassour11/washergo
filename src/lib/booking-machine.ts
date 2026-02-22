import { BookingStatus } from "@prisma/client";

/**
 * Booking status state machine.
 *
 * Defines valid transitions and the conditions under which they occur.
 * This is the single source of truth for booking lifecycle rules.
 */

// Valid transitions: from → allowed destinations
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT: ["QUALIFIED", "CANCELED"],
  QUALIFIED: ["SCHEDULED", "CANCELED"],
  SCHEDULED: ["PAID_SETUP", "CANCELED"],
  PAID_SETUP: ["CONTRACT_SIGNED", "CANCELED"],
  CONTRACT_SIGNED: ["ACTIVE", "CANCELED"],
  ACTIVE: ["PAST_DUE", "CLOSED", "CANCELED"],
  PAST_DUE: ["ACTIVE", "CANCELED", "CLOSED"],
  CANCELED: [],
  CLOSED: [],
};

export function canTransition(
  from: BookingStatus,
  to: BookingStatus,
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(
  from: BookingStatus,
  to: BookingStatus,
): void {
  if (!canTransition(from, to)) {
    throw new Error(
      `Invalid booking status transition: ${from} → ${to}`,
    );
  }
}

/**
 * Map step number → minimum status that step requires to already be at.
 * Also map step completion → the status it advances to.
 */
interface StepRule {
  /** The minimum status the booking must already be at to enter this step */
  requiredStatus: BookingStatus;
  /** The status the booking advances to when this step is completed */
  completesTo: BookingStatus;
}

export const STEP_RULES: Record<number, StepRule> = {
  1: { requiredStatus: "DRAFT", completesTo: "QUALIFIED" },
  2: { requiredStatus: "QUALIFIED", completesTo: "QUALIFIED" },
  3: { requiredStatus: "QUALIFIED", completesTo: "QUALIFIED" },
  4: { requiredStatus: "QUALIFIED", completesTo: "QUALIFIED" },
  5: { requiredStatus: "QUALIFIED", completesTo: "SCHEDULED" },
  6: { requiredStatus: "SCHEDULED", completesTo: "SCHEDULED" }, // Payment advances via webhook
  7: { requiredStatus: "PAID_SETUP", completesTo: "CONTRACT_SIGNED" },
  8: { requiredStatus: "CONTRACT_SIGNED", completesTo: "CONTRACT_SIGNED" },
};

/**
 * Ordered statuses for comparison (lower index = earlier in lifecycle).
 */
const STATUS_ORDER: BookingStatus[] = [
  "DRAFT",
  "QUALIFIED",
  "SCHEDULED",
  "PAID_SETUP",
  "CONTRACT_SIGNED",
  "ACTIVE",
];

export function isAtLeast(
  current: BookingStatus,
  required: BookingStatus,
): boolean {
  const currentIdx = STATUS_ORDER.indexOf(current);
  const requiredIdx = STATUS_ORDER.indexOf(required);
  if (currentIdx === -1 || requiredIdx === -1) return false;
  return currentIdx >= requiredIdx;
}

/**
 * Determine the maximum step a booking can be on based on its status.
 */
export function maxStepForStatus(status: BookingStatus): number {
  switch (status) {
    case "DRAFT":
      return 1;
    case "QUALIFIED":
      return 5;
    case "SCHEDULED":
      return 6;
    case "PAID_SETUP":
      return 7;
    case "CONTRACT_SIGNED":
    case "ACTIVE":
      return 8;
    default:
      return 0; // CANCELED, CLOSED, PAST_DUE
  }
}
