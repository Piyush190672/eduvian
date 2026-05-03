"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";

interface LogoutButtonProps {
  /** Where to send the user after logout completes. Defaults to "/". */
  redirectTo?: string;
  /** "compact" hides the label on narrow screens. */
  variant?: "default" | "compact";
  className?: string;
}

/**
 * Renders only when the user is signed in (localStorage has the student
 * record). On click: revokes the server-side session via /api/auth/logout,
 * clears localStorage, and routes to redirectTo.
 *
 * Purposely renders nothing during the brief hydration window so we don't
 * flash a logout button to anonymous visitors.
 */
export default function LogoutButton({
  redirectTo = "/",
  variant = "default",
  className,
}: LogoutButtonProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setSignedIn(!!localStorage.getItem("eduvian_student"));
    } catch {
      /* ignore */
    }
  }, []);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Server-side: delete user_sessions row + clear cookie. Same-origin
      // CSRF gate covers the POST automatically. Idempotent.
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }).catch(() => {
        /* network error — still clear client-side state below */
      });
    } finally {
      try {
        localStorage.removeItem("eduvian_student");
      } catch {
        /* ignore */
      }
      router.push(redirectTo);
      router.refresh();
    }
  };

  if (!mounted || !signedIn) return null;

  const compact = variant === "compact";
  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Sign out"
      className={
        className ??
        "flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-60 transition-colors"
      }
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      <span className={compact ? "hidden sm:inline" : ""}>{loading ? "Signing out…" : "Log out"}</span>
    </button>
  );
}
