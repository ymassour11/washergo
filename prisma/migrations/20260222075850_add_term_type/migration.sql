-- CreateEnum
CREATE TYPE "TermType" AS ENUM ('MONTH_TO_MONTH', 'SIX_MONTH', 'TWELVE_MONTH');

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "termType" "TermType";
