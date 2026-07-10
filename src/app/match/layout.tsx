import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'University Matcher — Free Program Shortlist',
  description:
    'Answer a 5-step profile and get up to 40 university programs matched to your academics, budget and goals — tiered into Safe, Reach and Ambitious. Free.',
  alternates: { canonical: "/match" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
