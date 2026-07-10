import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Study Abroad ROI Calculator',
  description:
    'Estimate payback period and 10-year return for any of 9,298 verified programs: real tuition, city-level living costs and median graduate salaries.',
  alternates: { canonical: "/roi-calculator" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
