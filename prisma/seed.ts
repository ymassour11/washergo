import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { hash } from "bcryptjs";
import { createHash } from "crypto";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ── Admin user ──
  const adminEmail = process.env.ADMIN_EMAIL || "admin@washerdryer.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  const passwordHash = await hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });
  console.log(`  Admin user: ${adminEmail}`);

  // ── Contract version ──
  const contractText = `WASHER/DRYER RENTAL AGREEMENT

This Rental Agreement ("Agreement") is entered into between the rental provider ("Company") and the customer ("Renter").

1. EQUIPMENT: Company agrees to rent to Renter the washer and/or dryer unit(s) as specified in the booking.

2. TERM: The minimum rental term is as specified at booking time. After the minimum term, the Agreement continues month-to-month until terminated by either party with 30 days written notice.

3. MONTHLY RENT: Renter agrees to pay the monthly rental amount specified at booking. Rent is due on the same day each month as the initial payment.

4. SETUP FEE: A one-time, non-refundable setup and delivery fee is charged at the time of booking.

5. MAINTENANCE: Company will maintain and repair the equipment at no additional charge for normal wear and tear. Renter must report any issues promptly.

6. DAMAGE: Renter is responsible for damage caused by misuse, negligence, or unauthorized modifications.

7. ACCESS: Renter agrees to provide reasonable access for maintenance and equipment retrieval.

8. TERMINATION: Either party may terminate after the minimum term with 30 days notice. Early termination may incur a fee.

9. GOVERNING LAW: This Agreement is governed by the laws of the state in which the rental property is located.`;

  const contentHash = createHash("sha256").update(contractText).digest("hex");

  await prisma.contractVersion.upsert({
    where: { version: "1.0" },
    update: { terms: contractText, contentHash },
    create: {
      version: "1.0",
      contentHash,
      terms: contractText,
      effectiveDate: new Date("2025-01-01"),
    },
  });
  console.log("  Contract version 1.0 created");

  // ── Delivery slots (next 4 weeks, Tue + Wed + Thu) ──
  const slotWindows = [
    { label: "9:00 AM - 12:00 PM", start: "09:00", end: "12:00" },
    { label: "1:00 PM - 4:00 PM", start: "13:00", end: "16:00" },
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let slotCount = 0;
  for (let dayOffset = 1; dayOffset <= 28; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay();

    // Only Tue (2), Wed (3), Thu (4)
    if (dayOfWeek < 2 || dayOfWeek > 4) continue;

    for (const window of slotWindows) {
      await prisma.deliverySlot.upsert({
        where: {
          date_windowStart: {
            date,
            windowStart: window.start,
          },
        },
        update: {},
        create: {
          date,
          windowLabel: window.label,
          windowStart: window.start,
          windowEnd: window.end,
          capacity: 2,
        },
      });
      slotCount++;
    }
  }
  console.log(`  ${slotCount} delivery slots created`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
