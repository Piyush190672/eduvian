"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

interface Props {
  backLabel?: string;
  backHref?: string; // if set, use Link; otherwise use router.back()
}

export default function NavButtons({ backLabel = "Go Back", backHref }: Props) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      {backHref ? (
        <Link
          href={backHref}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/70 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {backLabel}
        </Link>
      ) : (
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/70 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {backLabel}
        </button>
      )}
      <Link
        href="/"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white/70 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
      >
        <Home className="w-3.5 h-3.5" />
        Home
      </Link>
    </div>
  );
}
