import Link from "next/link";
import { Home, Search, MessageCircle } from "lucide-react";
import { EduvianLogoMark } from "@/components/EduvianLogo";

/**
 * Custom 404 page. Replaces Next.js's default "404 — This page could
 * not be found" which provides no path forward.
 *
 * User-reported (20 May 2026): clicking Parent Decision / Account
 * Security during a deploy occasionally hit 404, and refreshing the
 * default 404 page didn't get them back to the homepage — there was
 * no link. This page surfaces three concrete next steps and keeps
 * the brand voice intact.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 px-6 py-16">
      <Link href="/" aria-label="eduvianAI home" className="mb-10">
        <EduvianLogoMark size={48} />
      </Link>

      <div className="max-w-xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-700 mb-4">
          Error 404
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-3">
          We can&apos;t find that page.
        </h1>
        <p className="text-base text-gray-500 leading-relaxed mb-10">
          The link you followed may be outdated, or the page was renamed.
          Try one of these instead — you&apos;ll be back on track in seconds.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <Link
            href="/"
            className="group flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border-2 border-violet-200 bg-white hover:border-violet-400 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <Home className="w-5 h-5 text-violet-700" />
            </div>
            <span className="text-sm font-bold text-gray-900">Back to home</span>
            <span className="text-xs text-gray-500 text-center">Start from the beginning</span>
          </Link>

          <Link
            href="/profile"
            className="group flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border-2 border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Search className="w-5 h-5 text-indigo-700" />
            </div>
            <span className="text-sm font-bold text-gray-900">Match programs</span>
            <span className="text-xs text-gray-500 text-center">Free shortlist · 2 min</span>
          </Link>

          <Link
            href="/get-started"
            className="group flex flex-col items-center gap-2 px-4 py-5 rounded-2xl border-2 border-gray-200 bg-white hover:border-indigo-300 hover:shadow-lg transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <MessageCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <span className="text-sm font-bold text-gray-900">Sign in / Register</span>
            <span className="text-xs text-gray-500 text-center">Access saved progress</span>
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-10 leading-relaxed">
          If you keep hitting this page, our deploy may be in flight — refresh
          in 30 seconds. If it persists,{" "}
          <a
            href="mailto:support@eduvianai.com"
            className="text-violet-700 hover:text-violet-900 underline-offset-2 hover:underline font-semibold"
          >
            email support
          </a>
          .
        </p>
      </div>
    </div>
  );
}
