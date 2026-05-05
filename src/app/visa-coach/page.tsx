"use client";

import VisaCoach from "@/components/VisaCoach";
import AuthGate from "@/components/AuthGate";
import DecisionDisclaimer from "@/components/DecisionDisclaimer";
import BrandNav from "@/components/BrandNav";
import BrandHero, { accent } from "@/components/BrandHero";
import { DB_STATS } from "@/data/db-stats";

export default function VisaCoachPage() {
  return (
    <AuthGate stage={4} toolName="Visa Coach" source="visa-coach">
      <div className="min-h-screen bg-white font-sans antialiased text-gray-900">
        <BrandNav variant="dark" />
        <BrandHero
          eyebrow="Visa Coach"
          title={<>Get your student visa right. {accent("The first time.")}</>}
          subtitle="Country-specific checklists, financial proof rules, deadlines, and risk flags — sourced from official government pages, with a direct link to the application portal."
          trustLine={<>{DB_STATS.countriesLabel} countries · Official-source checklists · Decision-support estimates · Always confirm with the embassy</>}
        />
        <main className="max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
          <div className="mb-10">
            <DecisionDisclaimer variant="visa" />
          </div>
          <VisaCoach />
        </main>
      </div>
    </AuthGate>
  );
}
