import { auth } from "@/auth";

/**
 * Defense-in-depth: verify portal session inside each API route handler.
 * Returns { userId, customerId } or null if unauthorized.
 *
 * Every /api/portal/* route should call this — don't rely solely on middleware.
 */
export async function getPortalSession(): Promise<{
  userId: string;
  customerId: string;
} | null> {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "CUSTOMER") return null;
  if (!session.user.customerId) return null;
  return {
    userId: session.user.id,
    customerId: session.user.customerId,
  };
}
