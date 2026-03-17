/**
 * Test Payment Script
 *
 * Creates a $1/mo test subscription checkout session to verify
 * the full Stripe payment flow (checkout → webhook → booking update).
 *
 * Usage: npx tsx scripts/test-payment.ts
 *
 * What it does:
 * 1. Creates a $1/mo recurring test price in Stripe (or reuses existing)
 * 2. Creates a new booking in SCHEDULED state for Yassine
 * 3. Generates a Stripe Checkout URL to open in browser
 *
 * After payment, the webhook should:
 * - Transition booking to PAID_SETUP
 * - Store Stripe customer/subscription IDs
 * - Create a PaymentRecord on invoice.paid
 */

import "dotenv/config";
import Stripe from "stripe";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY?.trim();
if (!STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { typescript: true });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim();

async function main() {
  console.log("=== GoWash Test Payment Script ===\n");

  // Step 1: Create or find $1/mo test price
  console.log("1. Setting up $1/mo test price in Stripe...");
  let testPrice: Stripe.Price;

  // Search for existing test price
  const existingPrices = await stripe.prices.search({
    query: `metadata["test"]:"true" AND metadata["purpose"]:"gowash_test_payment"`,
  });

  if (existingPrices.data.length > 0 && existingPrices.data[0].active) {
    testPrice = existingPrices.data[0];
    console.log(`   Found existing test price: ${testPrice.id}`);
  } else {
    // Create a product for the test
    const product = await stripe.products.create({
      name: "GoWash Test - $1/mo",
      description: "Test subscription for payment flow verification",
      metadata: { test: "true", purpose: "gowash_test_payment" },
    });

    testPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 100, // $1.00
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { test: "true", purpose: "gowash_test_payment" },
    });
    console.log(`   Created test price: ${testPrice.id} ($1.00/mo)`);
  }

  // Step 2: Get existing customer record for Yassine
  const customer = await prisma.customer.findFirst({
    where: { name: { contains: "Yassine", mode: "insensitive" } },
  });

  if (!customer) {
    console.error("Customer 'Yassine' not found in database");
    process.exit(1);
  }
  console.log(`\n2. Using customer: ${customer.name} (${customer.email})`);

  // Step 3: Get a delivery slot
  const slot = await prisma.deliverySlot.findFirst({
    where: { date: { gte: new Date() }, isActive: true },
    orderBy: { date: "asc" },
  });

  if (!slot) {
    console.error("No available delivery slots found");
    process.exit(1);
  }
  console.log(`   Delivery slot: ${slot.date.toISOString().split("T")[0]} ${slot.windowLabel}`);

  // Step 4: Create a test booking at SCHEDULED status (ready for payment)
  console.log("\n3. Creating test booking (SCHEDULED, step 6)...");
  const booking = await prisma.booking.create({
    data: {
      customerId: customer.id,
      status: "SCHEDULED",
      currentStep: 6,
      packageType: "WASHER_DRYER",
      termType: "TWELVE_MONTH",
      monthlyPriceCents: 100, // $1.00 for test
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
      adminNotes: "TEST BOOKING - $1/mo payment flow test",
    },
  });
  console.log(`   Booking ID: ${booking.id}`);

  // Step 5: Create Stripe Checkout session
  console.log("\n4. Creating Stripe Checkout session...");
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: testPrice.id, quantity: 1 }],
    payment_method_types: ["card"],
    customer_email: customer.email,
    metadata: { bookingId: booking.id },
    subscription_data: {
      metadata: { bookingId: booking.id },
      description: "GoWash TEST - $1/mo payment flow test",
    },
    success_url: `${APP_URL}/book/${booking.id}?step=7&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/book/${booking.id}?step=6&canceled=true`,
  });

  console.log(`   Session ID: ${session.id}`);
  console.log(`\n${"=".repeat(60)}`);
  console.log(`\n   CHECKOUT URL (open in browser):\n`);
  console.log(`   ${session.url}\n`);
  console.log(`${"=".repeat(60)}`);
  console.log(`\n   Booking ID: ${booking.id}`);
  console.log(`   Amount: $1.00/mo (test)`);
  console.log(`   Test card: 4242 4242 4242 4242`);
  console.log(`   Expiry: any future date | CVC: any 3 digits\n`);
  console.log(`   After payment, check booking status with:`);
  console.log(`   docker exec washer-dryer-postgres-1 psql -U washerdryer -d washerdryer -c "SELECT id, status, \\"currentStep\\", \\"stripeCustomerId\\", \\"stripeSubscriptionId\\" FROM bookings WHERE id = '${booking.id}';"`);
  console.log();

  await prisma.$disconnect();
  await pool.end();
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
