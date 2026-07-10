import type { Metadata } from "next";

// Server layout exists solely to carry per-route metadata — the page
// itself is a client component and can't export it. (Phase 2 SEO
// plumbing, 10 July 2026.)
export const metadata: Metadata = {
  title: 'Application Tracker — Deadlines & Documents',
  description:
    'Track every application on a kanban board with deadline countdowns, per-program checklists and document version history.',
  alternates: { canonical: "/application-tracker" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
