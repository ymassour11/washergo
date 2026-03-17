import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

// Security headers applied to all responses
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://checkout.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://billing.stripe.com",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; "),
};

if (process.env.NODE_ENV === "production") {
  SECURITY_HEADERS["Strict-Transport-Security"] =
    "max-age=63072000; includeSubDomains; preload";
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export default auth((req) => {
  const response = NextResponse.next();

  // Inject request ID for tracing (use crypto.randomUUID which is available in Edge runtime)
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  response.headers.set("x-request-id", requestId);

  // Apply security headers
  applySecurityHeaders(response);

  // Protect admin routes — require authenticated user with ADMIN or STAFF role
  if (req.nextUrl.pathname.startsWith("/admin")) {
    // Allow the login page itself
    if (req.nextUrl.pathname === "/admin/login") {
      return response;
    }

    const session = req.auth;
    if (!session?.user) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!["ADMIN", "STAFF"].includes(session.user.role)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Protect portal routes — require authenticated CUSTOMER
  if (req.nextUrl.pathname.startsWith("/portal")) {
    if (
      req.nextUrl.pathname === "/portal/login" ||
      req.nextUrl.pathname === "/portal/register"
    ) {
      return response;
    }

    const session = req.auth;
    if (!session?.user) {
      const loginUrl = new URL("/portal/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (session.user.role !== "CUSTOMER") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Protect admin API routes
  if (req.nextUrl.pathname.startsWith("/api/admin")) {
    const session = req.auth;
    if (!session?.user || !["ADMIN", "STAFF"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Protect portal API routes
  if (req.nextUrl.pathname.startsWith("/api/portal")) {
    // Allow register endpoint (public, rate-limited in handler)
    if (req.nextUrl.pathname === "/api/portal/register") {
      return response;
    }

    const session = req.auth;
    if (!session?.user || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // CSRF: validate Origin header on mutating admin and portal API requests
  if (
    (req.nextUrl.pathname.startsWith("/api/admin") || req.nextUrl.pathname.startsWith("/api/portal")) &&
    ["POST", "PATCH", "PUT", "DELETE"].includes(req.method)
  ) {
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ error: "CSRF rejected" }, { status: 403 });
      }
    }
  }

  return response;
});

export const config = {
  matcher: [
    // Match all paths except static files and Next internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
