import type { MetadataRoute } from "next";

/**
 * robots.txt (Phase 2 SEO plumbing, 10 July 2026).
 * Token-keyed and account surfaces stay out of the index; everything
 * else is crawlable. Sitemap advertised for discovery.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/account/",
          "/results/",            // token-keyed, per-user
          "/profile-evaluation/", // token-keyed, per-user
          "/parent-view",
          "/profile",             // form state, nothing indexable
        ],
      },
    ],
    sitemap: "https://www.eduvianai.com/sitemap.xml",
  };
}
