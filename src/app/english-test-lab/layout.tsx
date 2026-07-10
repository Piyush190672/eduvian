import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'IELTS, TOEFL, PTE & DET Practice Lab',
  description:
    'Full-length IELTS, TOEFL, PTE and Duolingo mock tests with AI-scored writing and speaking, band prediction and improvement tips.',
  alternates: { canonical: "/english-test-lab" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
