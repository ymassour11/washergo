import { describe, it, expect } from "vitest";
import {
  canTransition,
  assertTransition,
  isAtLeast,
  maxStepForStatus,
  STEP_RULES,
} from "@/lib/booking-machine";

describe("canTransition", () => {
  it("allows DRAFT → QUALIFIED", () => {
    expect(canTransition("DRAFT", "QUALIFIED")).toBe(true);
  });

  it("allows DRAFT → CANCELED", () => {
    expect(canTransition("DRAFT", "CANCELED")).toBe(true);
  });

  it("rejects DRAFT → ACTIVE", () => {
    expect(canTransition("DRAFT", "ACTIVE")).toBe(false);
  });

  it("rejects DRAFT → PAID_SETUP (must go through QUALIFIED + SCHEDULED)", () => {
    expect(canTransition("DRAFT", "PAID_SETUP")).toBe(false);
  });

  it("allows QUALIFIED → SCHEDULED", () => {
    expect(canTransition("QUALIFIED", "SCHEDULED")).toBe(true);
  });

  it("allows SCHEDULED → PAID_SETUP", () => {
    expect(canTransition("SCHEDULED", "PAID_SETUP")).toBe(true);
  });

  it("allows PAID_SETUP → CONTRACT_SIGNED", () => {
    expect(canTransition("PAID_SETUP", "CONTRACT_SIGNED")).toBe(true);
  });

  it("allows CONTRACT_SIGNED → ACTIVE", () => {
    expect(canTransition("CONTRACT_SIGNED", "ACTIVE")).toBe(true);
  });

  it("allows ACTIVE → PAST_DUE", () => {
    expect(canTransition("ACTIVE", "PAST_DUE")).toBe(true);
  });

  it("allows PAST_DUE → ACTIVE (payment recovered)", () => {
    expect(canTransition("PAST_DUE", "ACTIVE")).toBe(true);
  });

  it("rejects transitions from CANCELED (terminal)", () => {
    expect(canTransition("CANCELED", "ACTIVE")).toBe(false);
    expect(canTransition("CANCELED", "DRAFT")).toBe(false);
  });

  it("rejects transitions from CLOSED (terminal)", () => {
    expect(canTransition("CLOSED", "ACTIVE")).toBe(false);
  });
});

describe("assertTransition", () => {
  it("does not throw for valid transitions", () => {
    expect(() => assertTransition("DRAFT", "QUALIFIED")).not.toThrow();
  });

  it("throws for invalid transitions", () => {
    expect(() => assertTransition("DRAFT", "ACTIVE")).toThrow(
      "Invalid booking status transition: DRAFT → ACTIVE",
    );
  });
});

describe("isAtLeast", () => {
  it("QUALIFIED is at least DRAFT", () => {
    expect(isAtLeast("QUALIFIED", "DRAFT")).toBe(true);
  });

  it("DRAFT is at least DRAFT", () => {
    expect(isAtLeast("DRAFT", "DRAFT")).toBe(true);
  });

  it("DRAFT is NOT at least QUALIFIED", () => {
    expect(isAtLeast("DRAFT", "QUALIFIED")).toBe(false);
  });

  it("ACTIVE is at least SCHEDULED", () => {
    expect(isAtLeast("ACTIVE", "SCHEDULED")).toBe(true);
  });

  it("returns false for non-lifecycle statuses", () => {
    expect(isAtLeast("CANCELED", "DRAFT")).toBe(false);
  });
});

describe("maxStepForStatus", () => {
  it("DRAFT allows step 1", () => {
    expect(maxStepForStatus("DRAFT")).toBe(1);
  });

  it("QUALIFIED allows up to step 5", () => {
    expect(maxStepForStatus("QUALIFIED")).toBe(5);
  });

  it("SCHEDULED allows step 6", () => {
    expect(maxStepForStatus("SCHEDULED")).toBe(6);
  });

  it("PAID_SETUP allows step 7", () => {
    expect(maxStepForStatus("PAID_SETUP")).toBe(7);
  });

  it("CONTRACT_SIGNED allows step 8", () => {
    expect(maxStepForStatus("CONTRACT_SIGNED")).toBe(8);
  });

  it("CANCELED returns 0", () => {
    expect(maxStepForStatus("CANCELED")).toBe(0);
  });
});

describe("STEP_RULES", () => {
  it("has rules for steps 1-7", () => {
    for (let i = 1; i <= 7; i++) {
      expect(STEP_RULES[i]).toBeDefined();
      expect(STEP_RULES[i].requiredStatus).toBeTruthy();
      expect(STEP_RULES[i].completesTo).toBeTruthy();
    }
  });

  it("step 1 requires DRAFT and completes to QUALIFIED", () => {
    expect(STEP_RULES[1]).toEqual({
      requiredStatus: "DRAFT",
      completesTo: "QUALIFIED",
    });
  });

  it("step 5 requires QUALIFIED and completes to SCHEDULED", () => {
    expect(STEP_RULES[5]).toEqual({
      requiredStatus: "QUALIFIED",
      completesTo: "SCHEDULED",
    });
  });

  it("step 7 requires PAID_SETUP and completes to CONTRACT_SIGNED", () => {
    expect(STEP_RULES[7]).toEqual({
      requiredStatus: "PAID_SETUP",
      completesTo: "CONTRACT_SIGNED",
    });
  });
});
