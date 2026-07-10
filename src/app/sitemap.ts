import type { MetadataRoute } from "next";
import { GENERATED_DB_STATS } from "@/data/db-stats-generated";
import { allProgramUrls } from "@/lib/program-slugs";

const BASE = "https://www.eduvianai.com";

/**
 * Sitemap for all indexable public pages (Phase 2 SEO plumbing,
 * 10 July 2026 — the site previously had NO sitemap, robots.txt or
 * per-route metadata, leaving 9,298 verified programs invisible to
 * search engines).
 *
 * Deliberately excluded: token-keyed pages (/results, /profile-evaluation,
 * /parent-view), auth/account surfaces, /admin, and tool pages behind the
 * AuthGate whose content is app-like rather than indexable.
 *
 * Programmatic tree (Phase 2 #10b, 10 July 2026): /programs +
 * /programs/[country]/[university]/[program] — ~9,900 URLs derived from
 * the verified database via src/lib/program-slugs.ts.
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

  const staticEntries = pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  // Depth-based priority: /programs index 0.8, country hubs 0.7,
  // university hubs 0.6, program pages 0.5.
  const programEntries = ["/programs", ...allProgramUrls()].map((path) => {
    const depth = path.split("/").length - 1; // 1..4
    return {
      url: `${BASE}${path}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: [0, 0.8, 0.7, 0.6, 0.5][depth] ?? 0.5,
    };
  });

  return [...staticEntries, ...programEntries];
}
