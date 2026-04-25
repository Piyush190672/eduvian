/** @type {import('next').NextConfig} */
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Block clickjacking — page cannot be embedded in iframes
  { key: "X-Frame-Options", value: "DENY" },
  // Legacy XSS filter (belt-and-suspenders for older browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Don't leak full referrer URL to third parties
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Restrict browser features the page can use
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=(), payment=()" },
  // Force HTTPS for 1 year (only applies when served over HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  // Content Security Policy — allows same-origin resources + trusted CDNs
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Scripts: self + inline (Next.js requires unsafe-inline for hydration)
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: self + inline (Tailwind inlines styles)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + data URIs + trusted CDNs
      "img-src 'self' data: blob: https://flagcdn.com https://*.supabase.co",
      // API connections
      "connect-src 'self' https://*.supabase.co https://api.resend.com https://api.anthropic.com",
      // Media (audio for interview prep)
      "media-src 'self' blob:",
      // No objects/embeds/frames from external origins
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig = {
  images: {
    domains: ["flagcdn.com"],
  },
  experimental: {
    serverComponentsExternalPackages: ["mammoth", "pdf-parse"],
  },
  async headers() {
    return [
      {
        // Apply security headers to every route
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  // Tunnels Sentry through your domain to bypass ad-blockers
  tunnelRoute: "/monitoring",
});
