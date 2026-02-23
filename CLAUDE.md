# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Infrastructure (PostgreSQL 16 + Redis 7)
docker-compose up -d

# Database
npx prisma migrate dev          # Run migrations (interactive, dev)
npx prisma migrate deploy       # Deploy migrations (non-interactive, CI/prod)
npm run db:seed                  # Seed admin user + delivery slots + contract
npm run db:studio                # Open Prisma Studio GUI

# Development
npm run dev                      # Start Next.js dev server
npm run worker                   # Start BullMQ worker (SEPARATE process, required for webhooks)

# Testing
npx vitest run tests/unit/       # Run all unit tests (64 tests across 4 files)
npx vitest run tests/unit/booking-machine.test.ts  # Run a single test file
npx vitest --watch               # Watch mode
npm run test:e2e                 # Playwright E2E tests

# Quality
npm run typecheck                # TypeScript type checking (tsc --noEmit)
npm run lint                     # ESLint
```

## Architecture

### Booking State Machine

The booking flow is an 8-step wizard governed by a state machine in `src/lib/booking-machine.ts`:

```
DRAFT → Step 1 (zip eligibility) → QUALIFIED
QUALIFIED → Steps 2-4 (package, address, hookups) → QUALIFIED
QUALIFIED → Step 5 (delivery slot) → SCHEDULED
SCHEDULED → Step 6 (payment via Stripe Checkout) → PAID_SETUP (webhook-driven)
PAID_SETUP → Step 7 (contract signing) → CONTRACT_SIGNED
CONTRACT_SIGNED → Step 8 (confirmation) → admin marks ACTIVE
```

Terminal states: CANCELED, CLOSED. Recovery: PAST_DUE → ACTIVE (on invoice.paid).

`STEP_RULES` maps each step to required status and completion status. `canTransition()` and `assertTransition()` enforce valid moves.

### API Structure

- **Customer routes** (`/api/bookings`, `/api/bookings/[id]`, `/api/delivery-slots`) — protected by signed JWT booking token in httpOnly cookie, not auth session
- **Stripe routes** (`/api/stripe/checkout-session`, `/api/stripe/webhook`) — checkout requires booking token; webhook requires Stripe signature
- **Admin routes** (`/api/admin/bookings`, `/api/admin/bookings/[id]`) — protected by Auth.js session (ADMIN/STAFF role), CSRF validated via Origin header

### Background Workers (BullMQ)

Three queues defined in `src/lib/queue/client.ts`, processed by `src/workers/index.ts` (runs as separate process via `npm run worker`):

1. **stripe-webhook** — Processes Stripe events after webhook stores them idempotently in `StripeEvent` table
2. **notifications** — Email/SMS stubs (currently logs to console)
3. **slot-release** — Releases expired delivery slot holds after 15 minutes

### Pricing

2D matrix in `src/lib/config.ts`: 3 packages (WASHER_DRYER, WASHER_ONLY, DRYER_ONLY) x 3 terms (MONTH_TO_MONTH, SIX_MONTH, TWELVE_MONTH). Each cell maps to Stripe price IDs via environment variable keys.

### Security Layers

- **Booking tokens**: Signed JWTs (24h expiry) prevent booking ID enumeration. Set as cookie on booking creation.
- **Rate limiting**: In-memory sliding window (`src/lib/rate-limit.ts`). Single-instance only.
- **Middleware** (`src/middleware.ts`): Auth.js session check, admin route protection, CSRF on admin mutations, CSP/HSTS/security headers.
- **Slot capacity**: Serializable Prisma transactions prevent overbooking delivery slots.

## Key Patterns & Gotchas

**Prisma v7**: No `url` in `datasource` block in schema.prisma. Config lives in `prisma.config.ts`. PrismaClient requires `adapter` param from `@prisma/adapter-pg`.

**Auth.js v5 (beta)**: Split config — `src/auth.config.ts` (Edge-safe) and `src/auth.ts` (Node runtime with Credentials provider). No `@auth/core/jwt` module augmentation; cast types directly in jwt/session callbacks.

**Zod v4**: Error messages use positional syntax: `z.literal(true, "message")` and `z.enum([...], "message")`, NOT the old `{ errorMap }` object syntax.

**BullMQ**: Use plain `{ host, port, maxRetriesPerRequest: null }` config object, not an ioredis instance (avoids version conflicts).

**Stripe**: SDK is lazy-initialized via Proxy in `src/lib/stripe.ts` (defers env check to first use for Vercel build compatibility). Don't hardcode `apiVersion`.

**Next.js 16**: Pages using `useSearchParams` must be wrapped in `<Suspense>`. External packages declared in `serverExternalPackages` in next.config.ts.

**Webhook idempotency**: Events stored in `StripeEvent` table with unique `stripeEventId` before enqueueing to BullMQ. Handler checks `processed` flag before running business logic.

## Deployment

- **Vercel**: Production at washer-dryer.vercel.app. `postinstall` script runs `prisma generate`.
- **Neon**: Hosted PostgreSQL. Migrations via `DATABASE_URL=<neon_url> npx prisma migrate deploy`.
- **Stripe**: 18 price IDs configured as env vars (script: `scripts/create-stripe-prices.sh`). Webhook endpoint registered for checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.deleted, customer.subscription.updated.
- **Worker**: BullMQ workers don't run on Vercel serverless. Need separate host or inline processing for full webhook handling.
