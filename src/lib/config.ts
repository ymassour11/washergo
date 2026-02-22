import { PackageType, TermType } from "@prisma/client";

// ── Service area ─────────────────────────────────────────
export const ALLOWED_ZIPS = new Set([
  // Placeholder — replace with your actual service area
  "77001", "77002", "77003", "77004", "77005",
  "77006", "77007", "77008", "77009", "77010",
  "77011", "77012", "77013", "77014", "77015",
  "77016", "77017", "77018", "77019", "77020",
  "77021", "77022", "77023", "77024", "77025",
  "77026", "77027", "77028", "77029", "77030",
]);

export const CONTACT_EMAIL = "hello@washerdryer.com";
export const CONTACT_PHONE = "(713) 555-0123";

// ── Terms ────────────────────────────────────────────────
export interface TermConfig {
  type: TermType;
  label: string;
  shortLabel: string;
  description: string;
  minimumTermMonths: number;
  cancellationNotice?: string;
  perks: string[];
  badge?: string;
}

export const TERMS: Record<TermType, TermConfig> = {
  MONTH_TO_MONTH: {
    type: "MONTH_TO_MONTH",
    label: "Month-to-Month",
    shortLabel: "M2M",
    description: "Maximum flexibility. Cancel anytime with 30 days notice.",
    minimumTermMonths: 2,
    cancellationNotice: "30 days",
    perks: [],
  },
  SIX_MONTH: {
    type: "SIX_MONTH",
    label: "6-Month Term",
    shortLabel: "6mo",
    description: "Great balance of value and flexibility.",
    minimumTermMonths: 6,
    perks: [],
    badge: "Popular",
  },
  TWELVE_MONTH: {
    type: "TWELVE_MONTH",
    label: "12-Month Term",
    shortLabel: "12mo",
    description: "Best value. Everything included.",
    minimumTermMonths: 12,
    perks: [
      "Free delivery & pickup",
      "Priority swap (2 business days)",
      "One free move within service area",
    ],
    badge: "Best Value",
  },
};

export const TERM_ORDER: TermType[] = [
  "MONTH_TO_MONTH",
  "SIX_MONTH",
  "TWELVE_MONTH",
];

// ── Packages ─────────────────────────────────────────────
export interface PackageConfig {
  type: PackageType;
  label: string;
  description: string;
  features: string[];
}

export const PACKAGES: Record<PackageType, PackageConfig> = {
  WASHER_DRYER: {
    type: "WASHER_DRYER",
    label: "Washer + Dryer",
    description: "Full-size washer and electric dryer, delivered and installed.",
    features: [
      "Full-size washer & dryer",
      "Free maintenance & repairs",
      "Swap or upgrade after minimum term",
    ],
  },
  WASHER_ONLY: {
    type: "WASHER_ONLY",
    label: "Washer Only",
    description: "Full-size washer, delivered and installed.",
    features: [
      "Full-size washer",
      "Free maintenance & repairs",
      "Swap or upgrade after minimum term",
    ],
  },
  DRYER_ONLY: {
    type: "DRYER_ONLY",
    label: "Dryer Only",
    description: "Full-size electric dryer, delivered and installed.",
    features: [
      "Full-size electric dryer",
      "Free maintenance & repairs",
      "Swap or upgrade after minimum term",
    ],
  },
};

// ── 2D Pricing Matrix (Package × Term) ──────────────────
export interface PricingCell {
  monthlyPriceCents: number;
  setupFeeCents: number;
  stripeMonthlyPriceIdEnvKey: string;
  stripeSetupPriceIdEnvKey: string;
}

export const PRICING: Record<PackageType, Record<TermType, PricingCell>> = {
  WASHER_DRYER: {
    MONTH_TO_MONTH: {
      monthlyPriceCents: 7900,
      setupFeeCents: 3900,
      stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_WD_M2M_MONTHLY",
      stripeSetupPriceIdEnvKey: "STRIPE_PRICE_WD_M2M_SETUP",
    },
    SIX_MONTH: {
      monthlyPriceCents: 6500,
      setupFeeCents: 3900,
      stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_WD_6MO_MONTHLY",
      stripeSetupPriceIdEnvKey: "STRIPE_PRICE_WD_6MO_SETUP",
    },
    TWELVE_MONTH: {
      monthlyPriceCents: 5900,
      setupFeeCents: 0,
      stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_WD_12MO_MONTHLY",
      stripeSetupPriceIdEnvKey: "STRIPE_PRICE_WD_12MO_SETUP",
    },
  },
  WASHER_ONLY: {
    MONTH_TO_MONTH: {
      monthlyPriceCents: 7900,
      setupFeeCents: 3900,
      stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_WO_M2M_MONTHLY",
      stripeSetupPriceIdEnvKey: "STRIPE_PRICE_WO_M2M_SETUP",
    },
    SIX_MONTH: {
      monthlyPriceCents: 4000,
      setupFeeCents: 3900,
      stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_WO_6MO_MONTHLY",
      stripeSetupPriceIdEnvKey: "STRIPE_PRICE_WO_6MO_SETUP",
    },
    TWELVE_MONTH: {
      monthlyPriceCents: 3600,
      setupFeeCents: 0,
      stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_WO_12MO_MONTHLY",
      stripeSetupPriceIdEnvKey: "STRIPE_PRICE_WO_12MO_SETUP",
    },
  },
  DRYER_ONLY: {
    MONTH_TO_MONTH: {
      monthlyPriceCents: 7900,
      setupFeeCents: 3900,
      stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_DO_M2M_MONTHLY",
      stripeSetupPriceIdEnvKey: "STRIPE_PRICE_DO_M2M_SETUP",
    },
    SIX_MONTH: {
      monthlyPriceCents: 3500,
      setupFeeCents: 3900,
      stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_DO_6MO_MONTHLY",
      stripeSetupPriceIdEnvKey: "STRIPE_PRICE_DO_6MO_SETUP",
    },
    TWELVE_MONTH: {
      monthlyPriceCents: 3200,
      setupFeeCents: 0,
      stripeMonthlyPriceIdEnvKey: "STRIPE_PRICE_DO_12MO_MONTHLY",
      stripeSetupPriceIdEnvKey: "STRIPE_PRICE_DO_12MO_SETUP",
    },
  },
};

export function getPricing(packageType: PackageType, termType: TermType): PricingCell {
  return PRICING[packageType][termType];
}

export function getStartingPrice(packageType: PackageType): number {
  return PRICING[packageType].TWELVE_MONTH.monthlyPriceCents;
}

// ── Slot hold duration ───────────────────────────────────
export const SLOT_HOLD_MINUTES = 15;

// ── Booking token ────────────────────────────────────────
export const BOOKING_TOKEN_EXPIRY_HOURS = 24;
