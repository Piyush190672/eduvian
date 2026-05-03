"use client";

import Link from "next/link";
import { ArrowLeft, Globe2 } from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import VisaCoach from "@/components/VisaCoach";
import AuthGate from "@/components/AuthGate";
import DecisionDisclaimer from "@/components/DecisionDisclaimer";

export default function VisaCoachPage() {
  return (
    <AuthGate stage={4} toolName="Visa Coach" source="visa-coach">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/30">
          <Link href="/" className="flex items-center gap-2">
            <EduvianLogoMark size={32} />
            <div>
              <span className="font-display font-bold text-xl text-gray-900 tracking-tight">
                eduvian<span className="text-indigo-500">AI</span>
              </span>
              <p className="text-xs font-medium text-gray-400 leading-none">
                Your Global Future, Simplified
              </p>
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

        <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-5">
                <Globe2 className="w-3.5 h-3.5" />
                Visa Readiness & Financial Documentation Coach
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                Get your student visa right.
                <br />
                <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
                  The first time.
                </span>
              </h1>
              <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Country-specific checklists, financial proof rules, deadlines, and risk
                flags — all sourced from official government pages. Plus a direct link to
                the official application portal.
              </p>
              <div className="mt-6 max-w-2xl mx-auto">
                <DecisionDisclaimer variant="visa" />
              </div>
            </div>

            <VisaCoach />
          </div>
        </main>
      </div>
    </AuthGate>
  );
}
