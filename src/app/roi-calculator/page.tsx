"use client";

import ROICalculator from "@/components/ROICalculator";
import AuthGate from "@/components/AuthGate";
import BrandNav from "@/components/BrandNav";
import BrandHero, { accent } from "@/components/BrandHero";
import { DB_STATS } from "@/data/db-stats";

export default function ROICalculatorPage() {
  return (
    <AuthGate stage={4} toolName="ROI Calculator" source="roi-calculator">
      <div className="min-h-screen bg-white font-sans antialiased text-gray-900">
        <BrandNav variant="dark" />
        <BrandHero
          eyebrow="ROI Calculator"
          title={<>See the {accent("payback math")} before you commit.</>}
          subtitle="Tuition, living costs, scholarships, and post-study earnings — modelled side-by-side so the financial decision isn't just intuition."
          trustLine={<>{DB_STATS.verifiedProgramsLabel} programs · {DB_STATS.verifiedUniversitiesLabel} universities · Decision-support estimates · Always confirm with the university</>}
        />
        <main className="max-w-7xl mx-auto px-6 sm:px-10 py-16 sm:py-20">
          <ROICalculator />
        </main>
      </div>
    </AuthGate>
  );
}
