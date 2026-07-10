import type { MetadataRoute } from "next";
import { GENERATED_DB_STATS } from "@/data/db-stats-generated";

const BASE = "https://www.eduvianai.com";

/**
 * Sitemap for all indexable public pages (Phase 2 SEO plumbing,
 * 10 July 2026 — the site previously had NO sitemap, robots.txt or
 * per-route metadata, leaving 9,298 verified programs invisible to
 * search engines).
 *
 * Deliberately excluded: token-keyed pages (/results, /profile-evaluation,
 * /parent-view), auth/account surfaces, /admin, and tool pages behind the
 * AuthGate whose content is app-like rather than indexable. Programmatic
 * program/university/country landing pages are the Phase-2b follow-up —
 * they'll append here once the URL structure is decided.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = GENERATED_DB_STATS.maxVerifiedAt
    ? new Date(GENERATED_DB_STATS.maxVerifiedAt)
    : new Date();

  const pages: Array<{ path: string; priority: number; changeFrequency: "weekly" | "monthly" }> = [
    { path: "",                      priority: 1.0, changeFrequency: "weekly"  },
    { path: "/destinations",         priority: 0.9, changeFrequency: "weekly"  },
    { path: "/methodology",          priority: 0.8, changeFrequency: "monthly" },
    { path: "/scholarships",         priority: 0.8, changeFrequency: "weekly"  },
    { path: "/match",                priority: 0.8, changeFrequency: "monthly" },
    { path: "/get-started",          priority: 0.7, changeFrequency: "monthly" },
    { path: "/roi-calculator",       priority: 0.7, changeFrequency: "monthly" },
    { path: "/parent-decision",      priority: 0.7, changeFrequency: "monthly" },
    { path: "/parent-report",        priority: 0.6, changeFrequency: "monthly" },
    { path: "/sample-parent-report", priority: 0.6, changeFrequency: "monthly" },
    { path: "/options",              priority: 0.6, changeFrequency: "weekly"  },
    { path: "/application-check",    priority: 0.6, changeFrequency: "monthly" },
    { path: "/interview-prep",       priority: 0.6, changeFrequency: "monthly" },
    { path: "/english-test-lab",     priority: 0.6, changeFrequency: "monthly" },
    { path: "/visa-coach",           priority: 0.6, changeFrequency: "monthly" },
    { path: "/sop-assistant",        priority: 0.5, changeFrequency: "monthly" },
    { path: "/lor-coach",            priority: 0.5, changeFrequency: "monthly" },
    { path: "/application-tracker",  priority: 0.5, changeFrequency: "monthly" },
    { path: "/security-policy",      priority: 0.2, changeFrequency: "monthly" },
  ];

  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
