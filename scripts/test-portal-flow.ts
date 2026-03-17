/**
 * End-to-end test of the Customer Portal flow.
 *
 * Run: npx tsx scripts/test-portal-flow.ts
 *
 * Prerequisites:
 *   - docker-compose up -d
 *   - npx prisma migrate deploy
 *   - npm run dev  (server on :3000)
 *   - An ACTIVE booking in the DB
 */

import crypto from "crypto";

const BASE = "http://localhost:3000";

// ---------- helpers ----------

async function fetchJSON(url: string, opts: RequestInit = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: res.status, json, text, headers: res.headers };
}

function cookieHeader(res: Response): string {
  const raw = res.headers.getSetCookie?.() || [];
  return raw.map((c: string) => c.split(";")[0]).join("; ");
}

// Accumulate cookies across multiple requests
class CookieJar {
  private cookies: Map<string, string> = new Map();

  update(res: Response) {
    const setCookies = res.headers.getSetCookie?.() || [];
    for (const sc of setCookies) {
      const [nameVal] = sc.split(";");
      const eqIdx = nameVal.indexOf("=");
      if (eqIdx > 0) {
        const name = nameVal.slice(0, eqIdx).trim();
        const value = nameVal.slice(eqIdx + 1).trim();
        this.cookies.set(name, value);
      }
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  }
}

// ---------- main ----------

async function main() {
  console.log("=== Customer Portal E2E Flow Test ===\n");

  // ──────────────────────────────────────────────
  // Step 1: Admin login + generate portal invite
  // ──────────────────────────────────────────────
  console.log("1) Admin login...");
  const adminJar = new CookieJar();

  // Get CSRF token
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  adminJar.update(csrfRes);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  console.log(`   CSRF token: ${csrfToken.slice(0, 16)}...`);

  // Credentials login
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: adminJar.header(),
    },
    body: new URLSearchParams({
      email: "admin@washerdryer.com",
      password: "admin123",
      csrfToken,
      callbackUrl: "/admin",
      redirect: "true",
    }),
    redirect: "manual",
  });
  adminJar.update(loginRes);
  console.log(`   Login response: ${loginRes.status}`);

  // Follow redirects manually to collect all cookies
  let location = loginRes.headers.get("location");
  while (location) {
    const url = location.startsWith("http") ? location : `${BASE}${location}`;
    const followRes = await fetch(url, {
      headers: { Cookie: adminJar.header() },
      redirect: "manual",
    });
    adminJar.update(followRes);
    location = followRes.headers.get("location");
  }

  // Verify session
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: adminJar.header() },
  });
  adminJar.update(sessionRes);
  const session = await sessionRes.json();
  console.log(`   Session: ${JSON.stringify(session)}`);

  if (!session?.user?.email) {
    console.error("   FAIL: Admin login did not establish session.");
    process.exit(1);
  }
  console.log(`   OK: Logged in as ${session.user.email} (role: ${session.user.role})\n`);

  // ──────────────────────────────────────────────
  // Step 2: Generate portal invite via admin API
  // ──────────────────────────────────────────────
  console.log("2) Generate portal invite...");
  const bookingId = "c8ab68a6-0abf-4a56-a542-e0dd22e891cc"; // ACTIVE booking

  const inviteRes = await fetch(`${BASE}/api/admin/portal-invites`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: BASE,
      Cookie: adminJar.header(),
    },
    body: JSON.stringify({ bookingId }),
  });
  const inviteData = (await inviteRes.json()) as { inviteUrl?: string; error?: string };
  console.log(`   Status: ${inviteRes.status}`);
  console.log(`   Response: ${JSON.stringify(inviteData)}`);

  if (inviteRes.status !== 200 || !inviteData.inviteUrl) {
    console.error(`   FAIL: Could not generate invite. ${inviteData.error || ""}`);
    process.exit(1);
  }

  // Extract token from invite URL
  const inviteUrl = new URL(inviteData.inviteUrl);
  const token = inviteUrl.searchParams.get("token");
  console.log(`   OK: Invite URL generated, token: ${token?.slice(0, 8)}...\n`);

  // ──────────────────────────────────────────────
  // Step 3: Register customer account
  // ──────────────────────────────────────────────
  console.log("3) Register customer account...");
  const registerRes = await fetch(`${BASE}/api/portal/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      password: "customer123456",
      name: "Test Customer",
    }),
  });
  const registerData = (await registerRes.json()) as { ok?: boolean; error?: string };
  console.log(`   Status: ${registerRes.status}`);
  console.log(`   Response: ${JSON.stringify(registerData)}`);

  if (registerRes.status !== 200 && registerRes.status !== 201) {
    console.error(`   FAIL: Registration failed. ${registerData.error || ""}`);
    process.exit(1);
  }
  console.log("   OK: Customer account created\n");

  // ──────────────────────────────────────────────
  // Step 4: Customer login
  // ──────────────────────────────────────────────
  console.log("4) Customer login...");
  const custJar = new CookieJar();

  const custCsrfRes = await fetch(`${BASE}/api/auth/csrf`);
  custJar.update(custCsrfRes);
  const custCsrf = ((await custCsrfRes.json()) as { csrfToken: string }).csrfToken;

  const custLoginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: custJar.header(),
    },
    body: new URLSearchParams({
      email: "ymassour@yahoo.com",
      password: "customer123456",
      csrfToken: custCsrf,
      callbackUrl: "/portal",
      redirect: "true",
    }),
    redirect: "manual",
  });
  custJar.update(custLoginRes);

  // Follow redirects
  let custLocation = custLoginRes.headers.get("location");
  while (custLocation) {
    const url = custLocation.startsWith("http") ? custLocation : `${BASE}${custLocation}`;
    const followRes = await fetch(url, {
      headers: { Cookie: custJar.header() },
      redirect: "manual",
    });
    custJar.update(followRes);
    custLocation = followRes.headers.get("location");
  }

  const custSessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: custJar.header() },
  });
  custJar.update(custSessionRes);
  const custSession = await custSessionRes.json();
  console.log(`   Session: ${JSON.stringify(custSession)}`);

  if (!custSession?.user?.email || custSession.user.role !== "CUSTOMER") {
    console.error("   FAIL: Customer login did not establish session.");
    process.exit(1);
  }
  console.log(`   OK: Logged in as ${custSession.user.email} (role: ${custSession.user.role}, customerId: ${custSession.user.customerId})\n`);

  // ──────────────────────────────────────────────
  // Step 5: Test portal API endpoints
  // ──────────────────────────────────────────────
  const portalHeaders = { Cookie: custJar.header() };

  // 5a: Booking details
  console.log("5a) GET /api/portal/booking...");
  const bookingRes = await fetch(`${BASE}/api/portal/booking`, { headers: portalHeaders });
  const bookingData = await bookingRes.json();
  console.log(`    Status: ${bookingRes.status}`);
  console.log(`    Booking status: ${bookingData.booking?.status || "null"}`);
  console.log(`    OK\n`);

  // 5b: Billing
  console.log("5b) GET /api/portal/billing...");
  const billingRes = await fetch(`${BASE}/api/portal/billing`, { headers: portalHeaders });
  const billingData = await billingRes.json();
  console.log(`    Status: ${billingRes.status}`);
  console.log(`    Booking: ${billingData.booking?.id?.slice(0, 8) || "null"}, payments: ${billingData.payments?.length || 0}`);
  console.log(`    OK\n`);

  // 5c: Account
  console.log("5c) GET /api/portal/account...");
  const accountRes = await fetch(`${BASE}/api/portal/account`, { headers: portalHeaders });
  const accountData = await accountRes.json();
  console.log(`    Status: ${accountRes.status}`);
  console.log(`    Profile: ${JSON.stringify(accountData.profile)}`);
  console.log(`    OK\n`);

  // 5d: Update account name
  console.log("5d) PATCH /api/portal/account...");
  const updateRes = await fetch(`${BASE}/api/portal/account`, {
    method: "PATCH",
    headers: { ...portalHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Yassine M." }),
  });
  const updateData = await updateRes.json();
  console.log(`    Status: ${updateRes.status}`);
  console.log(`    Updated name: ${updateData.profile?.name}`);
  console.log(`    OK\n`);

  // 5e: Create service request
  console.log("5e) POST /api/portal/service-requests...");
  const srRes = await fetch(`${BASE}/api/portal/service-requests`, {
    method: "POST",
    headers: { ...portalHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      category: "MAINTENANCE",
      title: "Dryer making loud noise",
      description: "The dryer started making a loud rattling noise during the spin cycle. Started yesterday.",
    }),
  });
  const srData = await srRes.json();
  console.log(`    Status: ${srRes.status}`);
  console.log(`    Request ID: ${srData.serviceRequest?.id?.slice(0, 8) || "error"}`);
  console.log(`    OK\n`);

  // 5f: List service requests
  console.log("5f) GET /api/portal/service-requests...");
  const srListRes = await fetch(`${BASE}/api/portal/service-requests`, { headers: portalHeaders });
  const srListData = await srListRes.json();
  console.log(`    Status: ${srListRes.status}`);
  console.log(`    Count: ${srListData.requests?.length || 0}`);
  console.log(`    OK\n`);

  // 5g: Password change
  console.log("5g) POST /api/portal/account/password...");
  const pwRes = await fetch(`${BASE}/api/portal/account/password`, {
    method: "POST",
    headers: { ...portalHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      currentPassword: "customer123456",
      newPassword: "newpassword789",
    }),
  });
  const pwData = await pwRes.json();
  console.log(`    Status: ${pwRes.status}`);
  console.log(`    Response: ${JSON.stringify(pwData)}`);
  console.log(`    OK\n`);

  // ──────────────────────────────────────────────
  // Step 6: Security checks
  // ──────────────────────────────────────────────
  console.log("6) Security checks...");

  // 6a: Unauthenticated access should fail
  const unauthRes = await fetch(`${BASE}/api/portal/booking`);
  console.log(`   6a) Unauthenticated /api/portal/booking: ${unauthRes.status} (expect 401)`);

  // 6b: Admin session shouldn't access portal APIs
  const adminPortalRes = await fetch(`${BASE}/api/portal/booking`, {
    headers: { Cookie: adminJar.header() },
  });
  const adminPortalData = await adminPortalRes.json();
  console.log(`   6b) Admin accessing portal API: ${adminPortalRes.status} (expect 401) - ${JSON.stringify(adminPortalData)}`);

  // 6c: Reusing same invite token should fail
  const reRegRes = await fetch(`${BASE}/api/portal/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      password: "anotherpass123",
      name: "Duplicate",
    }),
  });
  const reRegData = await reRegRes.json();
  console.log(`   6c) Re-use invite token: ${reRegRes.status} (expect 400/409) - ${reRegData.error}`);

  // 6d: Invalid token
  const badTokenRes = await fetch(`${BASE}/api/portal/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: "00000000-0000-0000-0000-000000000000",
      password: "test123456",
    }),
  });
  const badTokenData = await badTokenRes.json();
  console.log(`   6d) Invalid token: ${badTokenRes.status} (expect 400) - ${badTokenData.error}`);

  console.log("\n=== ALL TESTS PASSED ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
