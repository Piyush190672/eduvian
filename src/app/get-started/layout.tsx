import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Create Your Free Account',
  description:
    'Create a free eduvianAI account to save your university shortlist, track applications and access AI tools for SOPs, interviews and test prep.',
  alternates: { canonical: "/get-started" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
