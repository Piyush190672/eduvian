import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Visa & Admission Interview Practice',
  description:
    'Practice USA F-1, UK and Australia study-visa interviews with an AI coach: real question banks, live voice practice and detailed feedback.',
  alternates: { canonical: "/interview-prep" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
