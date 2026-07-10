import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'AI Application Strength Check',
  description:
    'Get an AI-scored read on your application story across 7 dimensions — academics, SOP, LORs, tests and more — with concrete fixes before you submit.',
  alternates: { canonical: "/application-check" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
