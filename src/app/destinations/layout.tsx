import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Study Destinations — 12 Countries Compared',
  description:
    'Compare studying in the USA, UK, Canada, Australia, Germany, Netherlands and 6 more destinations: tuition, living costs, post-study work visas and job markets — verified at source.',
  alternates: { canonical: "/destinations" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
