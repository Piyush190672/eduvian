import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

type Props = {
  variant?: "dark" | "light";
  ctaHref?: string;
  ctaLabel?: string;
};

// Brand-locked top nav, post-v2-swap (5 May 2026). `dark` sits transparently
// over the dark hero; `light` is the white-on-content variant for pages that
// don't lead with a dark hero.
export default function BrandNav({ variant = "dark", ctaHref = "/get-started", ctaLabel = "Find my programs" }: Props) {
  const isDark = variant === "dark";
  const wrapperCls = isDark ? "absolute top-0 inset-x-0 z-50" : "sticky top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-stone-200";
  const logoCls = isDark ? "text-white" : "text-gray-900";
  const linkCls = isDark
    ? "inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition-colors"
    : "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors";
  const ctaCls = isDark
    ? "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-gray-900 text-sm font-semibold hover:bg-stone-100 transition-colors"
    : "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors";

  return (
    <nav className={wrapperCls}>
      <div className="max-w-7xl mx-auto px-6 sm:px-10 h-16 flex items-center justify-between">
        <Link href="/" className={`flex items-center gap-2 ${logoCls}`}>
          <span className="font-display text-lg font-bold tracking-tight">eduvianAI</span>
        </Link>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="/" className={linkCls}>
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          {ctaHref && (
            <Link href={ctaHref} className={ctaCls}>
              {ctaLabel}
              {!isDark && <ArrowRight className="w-4 h-4" />}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
