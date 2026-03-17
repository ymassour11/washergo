import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit";

describe("rate limiter", () => {
  it("allows requests within limit", async () => {
    const key = `test-${Date.now()}-allow`;
    const config = { limit: 3, windowMs: 10000 };

    expect((await checkRateLimit(key, config)).allowed).toBe(true);
    expect((await checkRateLimit(key, config)).allowed).toBe(true);
    expect((await checkRateLimit(key, config)).allowed).toBe(true);
  });

  it("blocks requests over limit", async () => {
    const key = `test-${Date.now()}-block`;
    const config = { limit: 2, windowMs: 10000 };

    await checkRateLimit(key, config);
    await checkRateLimit(key, config);
    const result = await checkRateLimit(key, config);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks remaining count", async () => {
    const key = `test-${Date.now()}-remaining`;
    const config = { limit: 5, windowMs: 10000 };

    const r1 = await checkRateLimit(key, config);
    expect(r1.remaining).toBe(4);

    const r2 = await checkRateLimit(key, config);
    expect(r2.remaining).toBe(3);
  });

  it("different keys are independent", async () => {
    const config = { limit: 1, windowMs: 10000 };
    const key1 = `test-${Date.now()}-a`;
    const key2 = `test-${Date.now()}-b`;

    await checkRateLimit(key1, config);
    expect((await checkRateLimit(key1, config)).allowed).toBe(false);
    expect((await checkRateLimit(key2, config)).allowed).toBe(true);
  });
});
