import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Parent Decision Tool — Family-Ready Report',
  description:
    'A parent-ready decision report for any program: cost fit, payback, safety, job market, visa readiness and scholarship fit — colour-coded for the family conversation.',
  alternates: { canonical: "/parent-decision" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
