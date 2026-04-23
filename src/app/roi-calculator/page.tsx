"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import ROICalculator from "@/components/ROICalculator";
import AuthGate from "@/components/AuthGate";

export default function ROICalculatorPage() {
  return (
    <AuthGate stage={4} toolName="ROI Calculator" source="roi-calculator">
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/30">
        <Link href="/" className="flex items-center gap-2">
          <EduvianLogoMark size={32} />
          <div>
            <span className="font-display font-bold text-xl text-gray-900 tracking-tight">eduvian<span className="text-indigo-500">AI</span></span>
            <p className="text-xs font-medium text-gray-400 leading-none">Your Global Future, Simplified</p>
          </div>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </nav>

      <div className="pt-20">
        <ROICalculator />
      </div>
    </div>
    </AuthGate>
  );
}
