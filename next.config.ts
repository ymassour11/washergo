import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Stripe webhook needs raw body
  experimental: {},
  serverExternalPackages: ["pino", "pino-pretty", "bullmq", "ioredis"],
};

export default nextConfig;
