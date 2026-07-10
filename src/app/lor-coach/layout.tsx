import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'LOR Coach — Recommendation Letter Review',
  description:
    'Build a recommender brief and get AI feedback on recommendation letters — strength, specificity and credibility before they go out.',
  alternates: { canonical: "/lor-coach" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
