import { NextResponse } from "next/server";
import { submissionStore } from "@/lib/store";

export async function GET() {
  try {
    // Try Supabase first
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, token, profile, profile_category, email_sent, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return NextResponse.json({ leads: data });
      }
    }
  } catch {
    // fall through to in-memory
  }

  // Fallback: in-memory store
  const leads = Array.from(submissionStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return NextResponse.json({ leads });
}
