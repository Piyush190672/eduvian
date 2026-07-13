"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import SetPasswordCard from "@/components/SetPasswordCard";

/**
 * Dedicated, focused page for account-security tasks. Today this is just
 * the set / change password form. As we add more (revoke sessions, 2FA,
 * etc.) they slot in here under their own cards.
 *
 * Auth is handled inside SetPasswordCard (renders nothing when the user
 * isn't logged in) AND by the server on submit. This page is safe to
 * render for anyone — non-authenticated visitors just see the heading
 * and a "Sign in" CTA.
 */
export default function AccountSecurityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40 pb-16">
      <header className="px-6 pt-8 pb-4 max-w-2xl mx-auto">
        <Link href="/results" className="inline-flex items-center gap-2 text-sm text-blue-900 hover:text-blue-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-blue-900" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900">Account &amp; security</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage how you sign in. You can keep using the email-code option forever — adding a password is optional and lets you skip the code on future sign-ins.
            </p>
          </div>
        </div>
      </header>

      <SetPasswordCard />

      <div className="max-w-2xl mx-auto px-6 mt-8 text-xs text-gray-400 leading-relaxed">
        Not signed in? <Link href="/get-started" className="text-blue-900 hover:text-blue-900 underline">Sign in here</Link> first, then come back to this page to set a password.
      </div>
    </div>
  );
}
