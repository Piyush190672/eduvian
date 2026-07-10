import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Student Visa Checklists by Country',
  description:
    'Step-by-step student visa checklists for 12 destinations: documents, financial floors, processing windows and risk flags — sourced from consulate portals.',
  alternates: { canonical: "/visa-coach" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
