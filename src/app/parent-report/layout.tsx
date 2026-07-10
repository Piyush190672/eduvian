import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Parent Report — Shared Family View',
  description:
    "See your child's shortlist the way parents need it: total costs in rupees, payback periods, safety and visa context for every recommended program.",
  alternates: { canonical: "/parent-report" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
