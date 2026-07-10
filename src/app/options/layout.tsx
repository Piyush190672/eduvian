import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Compare Options by Cost, ROI, Visa & Scholarships',
  description:
    'Rank 9,298 verified programs through five lenses: lowest cost, better ROI, safer admits, lower visa complexity and stronger scholarship fit.',
  alternates: { canonical: "/options" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
