import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Scholarships for Indian Students Abroad',
  description:
    'Major scholarships for Indian students by destination — Chevening, DAAD, Erasmus Mundus, Fulbright and country-level funding routes, with eligibility notes.',
  alternates: { canonical: "/scholarships" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
