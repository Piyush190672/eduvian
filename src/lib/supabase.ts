import { createClient } from "@supabase/supabase-js";

function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// Lazy singleton — safe even when env vars are placeholders
let _supabase: ReturnType<typeof createClient> | null = null;
export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!isValidUrl(url) || !key) return null;
  if (!_supabase) _supabase = createClient(url!, key);
  return _supabase;
}

// Keep named export for backwards compat with client components
export const supabase = {
  get: getSupabase,
};

// Server-side client with secret key (for API routes)
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!isValidUrl(url) || !key) return null;
  return createClient(url!, key);
}
