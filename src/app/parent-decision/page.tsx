"use client";

import ParentDecisionTool from "@/components/ParentDecisionTool";
import AuthGate from "@/components/AuthGate";
import BrandNav from "@/components/BrandNav";
import BrandHero, { accent } from "@/components/BrandHero";
import { DB_STATS } from "@/data/db-stats";

export default function ParentDecisionPage() {
  return (
    <AuthGate stage={4} toolName="Parent Decision Tool" source="parent-decision">
      <div className="min-h-screen bg-white font-sans antialiased text-gray-900">
        <BrandNav variant="dark" />
        <BrandHero
          eyebrow="Parent Decision Tool"
          title={<>A {accent("parent-ready")} decision report — in minutes, not weeks.</>}
          subtitle="Cost fit, payback period, safety, job market, visa readiness, scholarship fit, family verdict — colour-coded for the conversation around the kitchen table."
          trustLine={<>{DB_STATS.verifiedProgramsLabel} programs · {DB_STATS.verifiedUniversitiesLabel} universities · Decision-support estimates · Always confirm with the university</>}
        />
        <main className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
          <ParentDecisionTool />
        </main>
      </div>
    </AuthGate>
  );
}
