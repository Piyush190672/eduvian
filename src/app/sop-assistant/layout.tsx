import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'SOP Assistant — Draft & Refine Your Statement',
  description:
    'Draft a structured statement of purpose for your exact program, then refine it with AI feedback tuned to what admissions panels flag.',
  alternates: { canonical: "/sop-assistant" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
