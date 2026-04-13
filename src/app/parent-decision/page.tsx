"use client";

import Link from "next/link";
import { Globe2, ArrowLeft } from "lucide-react";
import ParentDecisionTool from "@/components/ParentDecisionTool";

export default function ParentDecisionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/50">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-white/30">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Globe2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold text-xl text-gray-900">eduvianAI</span>
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
        <ParentDecisionTool />
      </div>
    </div>
  );
}
