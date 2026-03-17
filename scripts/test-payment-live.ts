/**
 * LIVE Payment Test Script
 *
 * Creates a real $1/mo subscription checkout session against
 * the production Neon DB and live Stripe.
 *
 * Usage: npx tsx --env-file=.env.prod-live scripts/test-payment-live.ts
 */

import Stripe from "stripe";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// -- env (trim trailing \n from Vercel env vars) --
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY?.trim();
const DB_URL = process.env.DATABASE_URL?.trim();
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "https://washer-dryer.vercel.app").trim();

if (!STRIPE_KEY || !STRIPE_KEY.startsWith("sk_live_")) {
  console.error("ERROR: STRIPE_SECRET_KEY must be a live key (sk_live_*)");
  console.error("Got:", STRIPE_KEY?.slice(0, 12) + "...");
  process.exit(1);
}
if (!DB_URL) {
  console.error("ERROR: DATABASE_URL is not set");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY, { typescript: true });
const pool = new pg.Pool({ connectionString: DB_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== GoWash LIVE Payment Test ===");
  console.log(`   App URL: ${APP_URL}`);
  console.log(`   Stripe:  LIVE mode (sk_live_...)\n`);

  // Step 1: Create $1/mo live price
  console.log("1. Creating $1/mo live price in Stripe...");
  let testPrice: Stripe.Price;

  const existing = await stripe.prices.search({
    query: `metadata["purpose"]:"gowash_live_test" active:"true"`,
  });

  if (existing.data.length > 0) {
    testPrice = existing.data[0];
    console.log(`   Reusing existing price: ${testPrice.id}`);
  } else {
    const product = await stripe.products.create({
      name: "GoWash LIVE Test - $1/mo",
      description: "Live payment test - $1/mo subscription",
      metadata: { purpose: "gowash_live_test" },
    });

    testPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 100, // $1.00
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { purpose: "gowash_live_test" },
    });
    console.log(`   Created price: ${testPrice.id} ($1.00/mo)`);
  }

  // Step 2: Find or create customer in production DB
  console.log("\n2. Setting up customer in production DB...");
  let customer = await prisma.customer.findFirst({
    where: { email: "ymassour@yahoo.com" },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        name: "Yassine Massour Elaoud",
        email: "ymassour@yahoo.com",
        phone: "2543390034",
      },
    });
    console.log(`   Created customer: ${customer.id}`);
  } else {
    console.log(`   Found customer: ${customer.name} (${customer.id})`);
  }

  // Step 3: Find or create a delivery slot in production DB
  console.log("\n3. Setting up delivery slot...");
  let slot = await prisma.deliverySlot.findFirst({
    where: { date: { gte: new Date() }, isActive: true },
    orderBy: { date: "asc" },
  });

  if (!slot) {
    // Create a slot for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    slot = await prisma.deliverySlot.create({
      data: {
        date: tomorrow,
        windowLabel: "9:00 AM - 12:00 PM",
        windowStart: "09:00",
        windowEnd: "12:00",
        capacity: 2,
        isActive: true,
      },
    });
    console.log(`   Created delivery slot: ${slot.id} (${tomorrow.toISOString().split("T")[0]})`);
  } else {
    const dateStr = slot.date instanceof Date ? slot.date.toISOString().split("T")[0] : String(slot.date);
    console.log(`   Found slot: ${dateStr} ${slot.windowLabel}`);
  }

  // Step 4: Create test booking at SCHEDULED
  console.log("\n4. Creating booking (SCHEDULED, step 6)...");
  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      status: "SCHEDULED",
      currentStep: 6,
      packageType: "WASHER_DRYER",
      termType: "TWELVE_MONTH",
      monthlyPriceCents: 100, // $1.00
      setupFeeCents: 0,
      minimumTermMonths: 1,
      serviceZip: "77001",
      hasHookups: true,
      addressLine1: "123 Test Street",
      city: "Houston",
      state: "TX",
      zip: "77001",
      dryerPlugType: "FOUR_PRONG",
      hasHotColdValves: true,
      hasDrainAccess: true,
      deliverySlotId: slot.id,
      adminNotes: "LIVE TEST - $1/mo payment flow verification",
    },
  });
  console.log(`   Booking ID: ${booking.id}`);

  // Step 5: Create live Stripe Checkout session
  console.log("\n5. Creating LIVE Stripe Checkout session...");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: testPrice.id, quantity: 1 }],
    payment_method_types: ["card"],
    customer_email: customer.email,
    metadata: { bookingId: booking.id },
    subscription_data: {
      metadata: { bookingId: booking.id },
      description: "GoWash LIVE TEST - $1/mo",
    },
    success_url: `${APP_URL}/book/${booking.id}?step=7&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/book/${booking.id}?step=6&canceled=true`,
  });

  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n  LIVE CHECKOUT URL (real $1.00 charge):\n`);
  console.log(`  ${session.url}\n`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\n  Booking ID:  ${booking.id}`);
  console.log(`  Amount:      $1.00/mo REAL subscription`);
  console.log(`  Customer:    ${customer.name} (${customer.email})`);
  console.log(`  Session ID:  ${session.id}`);
  console.log(`\n  Use a REAL card to pay.`);
  console.log(`  After payment, the webhook at ${APP_URL}/api/stripe/webhook`);
  console.log(`  should transition the booking to PAID_SETUP.\n`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch(async (err) => {
  console.error("Script failed:", err);
  await prisma.$disconnect().catch(() => {});
  await pool.end().catch(() => {});
  process.exit(1);
});
