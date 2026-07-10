import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Sample Parent Decision Report',
  description:
    'An example of the family decision report eduvianAI produces: costs, payback, safety and visa readiness for a real shortlist, formatted for parents.',
  alternates: { canonical: "/sample-parent-report" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
