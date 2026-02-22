import { describe, it, expect } from "vitest";
import {
  step1Schema,
  step2Schema,
  step3Schema,
  step4Schema,
  step5Schema,
  step6Schema,
  step7Schema,
} from "@/lib/validations";

describe("step1Schema (Eligibility)", () => {
  it("accepts valid zip in service area with hookups", () => {
    const result = step1Schema.safeParse({ serviceZip: "77001", hasHookups: true });
    expect(result.success).toBe(true);
  });

  it("rejects zip not in service area", () => {
    const result = step1Schema.safeParse({ serviceZip: "90210", hasHookups: true });
    expect(result.success).toBe(false);
  });

  it("rejects invalid zip format", () => {
    const result = step1Schema.safeParse({ serviceZip: "abc", hasHookups: true });
    expect(result.success).toBe(false);
  });

  it("rejects hasHookups = false", () => {
    const result = step1Schema.safeParse({ serviceZip: "77001", hasHookups: false });
    expect(result.success).toBe(false);
  });
});

describe("step2Schema (Package + Term)", () => {
  it("accepts packageType alone", () => {
    expect(step2Schema.safeParse({ packageType: "WASHER_DRYER" }).success).toBe(true);
  });

  it("accepts WASHER_ONLY", () => {
    expect(step2Schema.safeParse({ packageType: "WASHER_ONLY" }).success).toBe(true);
  });

  it("accepts DRYER_ONLY", () => {
    expect(step2Schema.safeParse({ packageType: "DRYER_ONLY" }).success).toBe(true);
  });

  it("accepts termType alone", () => {
    expect(step2Schema.safeParse({ termType: "SIX_MONTH" }).success).toBe(true);
  });

  it("accepts MONTH_TO_MONTH term", () => {
    expect(step2Schema.safeParse({ termType: "MONTH_TO_MONTH" }).success).toBe(true);
  });

  it("accepts TWELVE_MONTH term", () => {
    expect(step2Schema.safeParse({ termType: "TWELVE_MONTH" }).success).toBe(true);
  });

  it("rejects unknown package", () => {
    expect(step2Schema.safeParse({ packageType: "DISHWASHER" }).success).toBe(false);
  });

  it("rejects unknown term", () => {
    expect(step2Schema.safeParse({ termType: "TWO_YEAR" }).success).toBe(false);
  });

  it("rejects empty object", () => {
    expect(step2Schema.safeParse({}).success).toBe(false);
  });
});

describe("step3Schema (Address)", () => {
  const validAddress = {
    customerName: "Jane Doe",
    customerEmail: "jane@example.com",
    customerPhone: "713-555-0123",
    addressLine1: "123 Main St",
    city: "Houston",
    state: "TX",
    zip: "77001",
  };

  it("accepts valid address", () => {
    expect(step3Schema.safeParse(validAddress).success).toBe(true);
  });

  it("rejects missing name", () => {
    expect(step3Schema.safeParse({ ...validAddress, customerName: "" }).success).toBe(false);
  });

  it("rejects invalid email", () => {
    expect(step3Schema.safeParse({ ...validAddress, customerEmail: "notanemail" }).success).toBe(false);
  });

  it("rejects invalid state code", () => {
    expect(step3Schema.safeParse({ ...validAddress, state: "Texas" }).success).toBe(false);
  });
});

describe("step4Schema (Hookups)", () => {
  it("accepts valid hookup data", () => {
    const result = step4Schema.safeParse({
      dryerPlugType: "FOUR_PRONG",
      hasHotColdValves: true,
      hasDrainAccess: true,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing plug type", () => {
    const result = step4Schema.safeParse({
      hasHotColdValves: true,
      hasDrainAccess: true,
    });
    expect(result.success).toBe(false);
  });

  it("rejects unchecked valves", () => {
    const result = step4Schema.safeParse({
      dryerPlugType: "THREE_PRONG",
      hasHotColdValves: false,
      hasDrainAccess: true,
    });
    expect(result.success).toBe(false);
  });
});

describe("step5Schema (Delivery)", () => {
  it("accepts valid UUID", () => {
    const result = step5Schema.safeParse({
      deliverySlotId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID", () => {
    const result = step5Schema.safeParse({ deliverySlotId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("step6Schema (Payment consent)", () => {
  it("accepts authorized", () => {
    expect(step6Schema.safeParse({ authorizeRecurring: true }).success).toBe(true);
  });

  it("rejects not authorized", () => {
    expect(step6Schema.safeParse({ authorizeRecurring: false }).success).toBe(false);
  });
});

describe("step7Schema (Contract)", () => {
  it("accepts valid signature", () => {
    const result = step7Schema.safeParse({
      contractAccepted: true,
      signerName: "Jane Doe",
    });
    expect(result.success).toBe(true);
  });

  it("rejects not accepted", () => {
    const result = step7Schema.safeParse({
      contractAccepted: false,
      signerName: "Jane Doe",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = step7Schema.safeParse({
      contractAccepted: true,
      signerName: "J",
    });
    expect(result.success).toBe(false);
  });
});
