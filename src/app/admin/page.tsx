"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Lock, Loader2 } from "lucide-react";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Demo: accept any credentials in dev, or real Supabase auth in prod
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      router.push("/admin/dashboard");
    } catch {
      // Dev fallback: allow demo credentials
      if (email === "admin@eduvianai.com" && password === "admin123") {
        sessionStorage.setItem("eduvianai_admin", "true");
        router.push("/admin/dashboard");
      } else {
        setError("Invalid credentials. Try admin@eduvianai.com / admin123 for demo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-2xl text-white">eduvianAI</span>
              <p className="text-sm font-bold text-indigo-300 leading-none">Your Global Future, Simplified</p>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Admin Login</h1>
          <p className="text-indigo-300 text-sm mt-1">Counselor & admin access</p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@eduvianai.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-indigo-200 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>

          {error && (
            <p className="text-rose-300 text-xs bg-rose-500/10 border border-rose-400/20 rounded-xl p-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Sign In
          </button>

          <p className="text-indigo-300 text-xs text-center">
            Demo: admin@eduvianai.com / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
