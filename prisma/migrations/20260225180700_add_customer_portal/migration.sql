-- AlterEnum: Add CUSTOMER to UserRole
ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER';

-- AlterTable: Add customerId to users
ALTER TABLE "users" ADD COLUMN "customerId" TEXT;

-- CreateIndex: unique constraint on users.customerId
CREATE UNIQUE INDEX "users_customerId_key" ON "users"("customerId");

-- AddForeignKey: users.customerId -> customers.id
ALTER TABLE "users" ADD CONSTRAINT "users_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum: ServiceRequestCategory
CREATE TYPE "ServiceRequestCategory" AS ENUM ('MAINTENANCE', 'BILLING', 'MOVE_REQUEST', 'CANCELLATION', 'OTHER');

-- AlterTable: Add category and customerId to service_requests
ALTER TABLE "service_requests" ADD COLUMN "category" "ServiceRequestCategory" NOT NULL DEFAULT 'OTHER';
ALTER TABLE "service_requests" ADD COLUMN "customerId" TEXT;

-- CreateIndex on service_requests
CREATE INDEX "service_requests_customerId_idx" ON "service_requests"("customerId");
CREATE INDEX "service_requests_createdAt_idx" ON "service_requests"("createdAt");

-- AddForeignKey: service_requests.bookingId -> bookings.id
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: service_requests.customerId -> customers.id
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: portal_invites
CREATE TABLE "portal_invites" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_invites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex on portal_invites
CREATE UNIQUE INDEX "portal_invites_tokenHash_key" ON "portal_invites"("tokenHash");
CREATE INDEX "portal_invites_tokenHash_idx" ON "portal_invites"("tokenHash");
CREATE INDEX "portal_invites_email_idx" ON "portal_invites"("email");
CREATE INDEX "portal_invites_customerId_idx" ON "portal_invites"("customerId");
CREATE INDEX "portal_invites_expiresAt_idx" ON "portal_invites"("expiresAt");

-- AddForeignKey: portal_invites.customerId -> customers.id
ALTER TABLE "portal_invites" ADD CONSTRAINT "portal_invites_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
