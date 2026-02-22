import { v4 as uuidv4 } from "uuid";
import { headers } from "next/headers";

/**
 * Get or generate a request ID for tracing.
 * Checks for an existing X-Request-Id header (from reverse proxy),
 * otherwise generates a new UUID.
 */
export async function getRequestId(): Promise<string> {
  try {
    const hdrs = await headers();
    return hdrs.get("x-request-id") || uuidv4();
  } catch {
    return uuidv4();
  }
}
