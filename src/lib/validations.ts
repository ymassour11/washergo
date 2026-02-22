import { z } from "zod";
import { ALLOWED_ZIPS } from "./config";

// ── Step 1: Eligibility ──────────────────────────────────
export const step1Schema = z.object({
  serviceZip: z
    .string()
    .regex(/^\d{5}$/, "Enter a valid 5-digit zip code")
    .refine((zip) => ALLOWED_ZIPS.has(zip), {
      message: "Sorry, we don't service this area yet.",
    }),
  hasHookups: z.literal(true, "You must confirm you have washer/dryer hookups"),
});

// ── Step 2: Package + Term selection ─────────────────────
// Step 2 accepts either packageType (from equipment step) or termType (from plan step)
export const step2Schema = z.object({
  packageType: z.enum(["WASHER_DRYER", "WASHER_ONLY", "DRYER_ONLY"]).optional(),
  termType: z.enum(["MONTH_TO_MONTH", "SIX_MONTH", "TWELVE_MONTH"]).optional(),
}).refine(
  (data) => data.packageType || data.termType,
  "Must provide either packageType or termType",
);

// ── Step 3: Address + Property ───────────────────────────
export const step3Schema = z.object({
  customerName: z.string().min(2, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z
    .string()
    .min(10, "Phone number is required")
    .regex(/^[\d\s\-\(\)\+]+$/, "Enter a valid phone number"),
  addressLine1: z.string().min(3, "Street address is required"),
  addressLine2: z.string().optional().default(""),
  city: z.string().min(2, "City is required"),
  state: z.string().length(2, "Use 2-letter state code"),
  zip: z.string().regex(/^\d{5}$/, "Enter a valid zip code"),
  floor: z.coerce.number().int().min(1).max(99).optional(),
  hasElevator: z.boolean().optional(),
  gateCode: z.string().optional().default(""),
  entryNotes: z.string().optional().default(""),
  deliveryNotes: z.string().optional().default(""),
});

// ── Step 4: Hookups verification ─────────────────────────
export const step4Schema = z.object({
  dryerPlugType: z.enum(["THREE_PRONG", "FOUR_PRONG"], "Please select your dryer plug type"),
  hasHotColdValves: z.literal(true, "Hot and cold water valves must be present"),
  hasDrainAccess: z.literal(true, "A drain must be accessible"),
});

// ── Step 5: Delivery window ──────────────────────────────
export const step5Schema = z.object({
  deliverySlotId: z.string().uuid("Please select a delivery window"),
});

// ── Step 6: Payment ──────────────────────────────────────
export const step6Schema = z.object({
  authorizeRecurring: z.literal(true, "You must authorize recurring charges"),
});

// ── Step 7: Contract ─────────────────────────────────────
export const step7Schema = z.object({
  contractAccepted: z.literal(true, "You must accept the rental agreement"),
  signerName: z.string().min(2, "Please type your full name"),
});

// ── Per-step schema map ──────────────────────────────────
export const STEP_SCHEMAS: Record<number, z.ZodSchema> = {
  1: step1Schema,
  2: step2Schema,
  3: step3Schema,
  4: step4Schema,
  5: step5Schema,
  6: step6Schema,
  7: step7Schema,
};

export type Step1Data = z.infer<typeof step1Schema>;
export type Step2Data = z.infer<typeof step2Schema>;
export type Step3Data = z.infer<typeof step3Schema>;
export type Step4Data = z.infer<typeof step4Schema>;
export type Step5Data = z.infer<typeof step5Schema>;
export type Step6Data = z.infer<typeof step6Schema>;
export type Step7Data = z.infer<typeof step7Schema>;
