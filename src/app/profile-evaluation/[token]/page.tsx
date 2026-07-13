"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";
import LogoutButton from "@/components/LogoutButton";
import ProfileCard from "@/components/results/ProfileCard";
import type { StudentProfile } from "@/lib/types";

/**
 * /profile-evaluation/[token] — interstitial page shown right after a
 * student submits their profile. Renders the ProfileCard evaluation
 * (category badge, strengths, gaps) on its own, with a single primary
 * CTA at the bottom-right that opens the matched-programs page.
 *
 * Was originally folded into /results/[token] together with the
 * shortlist, but having both on one page confused users about what to
 * focus on. (13 May 2026)
 */
export default function ProfileEvaluationPage({ params }: { params: { token: string } }) {
  const { token } = params;

  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/results/${token}`);
        if (!res.ok) throw new Error("Profile not found");
        const json = await res.json();
        if (cancelled) return;
        setProfile(json.submission.profile as StudentProfile);
      } catch {
        if (!cancelled) setError("Could not load your profile evaluation. Please check the link.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-900" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-base font-semibold text-rose-700 mb-2">{error ?? "Something went wrong."}</p>
          <Link href="/profile" className="text-sm text-blue-800 hover:underline">Back to profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-32">
      {/* Nav — anchored below the BetaBanner + SecurityNoticeBanner stack
          via the CSS variables those banners publish. Without this offset
          the fixed nav lands behind the banners (fixed elements ignore
          body padding-top). */}
      <nav
        className="fixed left-0 right-0 z-40 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 glass border-b border-white/30 bg-white/80 backdrop-blur"
        style={{ top: "calc(var(--beta-banner-h, 0px) + var(--security-notice-h, 0px))" }}
      >
        <Link href="/" className="flex items-center" aria-label="eduvianAI home">
          <EduvianLogoMark size={32} />
        </Link>
        <div className="flex items-center gap-2">
          <LogoutButton variant="compact" />
          <Link
            href="/account/security"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            Security
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-10 pt-20 sm:pt-28">
        <header className="mb-8 sm:mb-10">
          <p className="text-[11px] uppercase tracking-[0.25em] text-blue-800 font-semibold mb-3">Step 1 of 2</p>
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 leading-tight mb-3">
            Your <span className="italic font-medium text-blue-800">profile evaluation</span>.
          </h1>
          <p className="text-base sm:text-lg text-gray-500 leading-relaxed max-w-2xl">
            A readiness snapshot built from the information you shared — three
            sub-scores, the parameters behind them, and the fastest ways to
            improve. It&apos;s a preparation guide, not a prediction of admission.
          </p>
        </header>

        <ProfileCard profile={profile} token={token} />
      </main>

      {/* Primary CTA — full-width sticky footer on mobile (so it
          doesn't sit on top of the parameter tiles), pill-shaped
          floating bottom-right on sm+. */}
      <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:right-10 sm:bottom-6 z-40">
        <Link
          href={`/results/${token}`}
          className="group flex sm:inline-flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto px-6 py-3.5 rounded-full bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold shadow-2xl shadow-blue-950/30 hover:shadow-xl sm:hover:-translate-y-0.5 transition-all"
        >
          Continue to matched programs
          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
