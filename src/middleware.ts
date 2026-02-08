import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware
 *
 * Runs before every request to add security headers and handle routing.
 * See: https://nextjs.org/docs/app/building-your-application/routing/middleware
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  // Protect against common web vulnerabilities

  /**
   * X-Frame-Options: DENY
   * Prevents clickjacking attacks by not allowing the page to be embedded in iframes
   */
  response.headers.set("X-Frame-Options", "DENY");

  /**
   * X-Content-Type-Options: nosniff
   * Prevents MIME type sniffing
   */
  response.headers.set("X-Content-Type-Options", "nosniff");

  /**
   * Referrer-Policy: strict-origin-when-cross-origin
   * Controls how much referrer information is included with requests
   */
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  /**
   * X-XSS-Protection: 1; mode=block
   * Enables XSS filtering in older browsers (legacy support)
   */
  response.headers.set("X-XSS-Protection", "1; mode=block");

  /**
   * Permissions-Policy
   * Controls which browser features can be used
   */
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  /**
   * Strict-Transport-Security (HSTS)
   * Forces HTTPS connections (only in production)
   */
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  /**
   * Content-Security-Policy
   * Helps prevent XSS, clickjacking, and other code injection attacks
   *
   * Note: This is a basic CSP. Customize based on your needs.
   * Consider using report-only mode first: Content-Security-Policy-Report-Only
   */
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https:;
    font-src 'self' data:;
    connect-src 'self' https:;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s{2,}/g, " ")
    .trim();

  response.headers.set("Content-Security-Policy", cspHeader);

  return response;
}

/**
 * Matcher configuration
 * Specifies which routes the middleware should run on
 *
 * Excludes:
 * - Static files (_next/static)
 * - Image optimization (_next/image)
 * - Favicon
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
