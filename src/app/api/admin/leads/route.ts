import { NextResponse } from "next/server";
import { submissionStore } from "@/lib/store";

export async function GET() {
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      // Fetch full-profile submissions
      const { data: submissions, error: subErr } = await supabase
        .from("submissions")
        .select("id, token, profile, profile_category, total_matched, shortlisted_ids, email_sent, created_at")
        .order("created_at", { ascending: false });

      // Fetch all registered students
      const { data: students, error: stuErr } = await supabase
        .from("students")
        .select("id, name, email, phone, source, source_stage, created_at")
        .order("created_at", { ascending: false });

      if (!subErr && !stuErr) {
        // Build set of emails that have a full submission
        const submittedEmails = new Set(
          (submissions ?? [])
            .map((s: { profile?: { email?: string } }) =>
              s.profile?.email?.toLowerCase().trim()
            )
            .filter(Boolean)
        );

        // Students who registered but never completed the full profile form
        const registrationsOnly = (students ?? []).filter(
          (st: { email: string }) =>
            !submittedEmails.has(st.email?.toLowerCase().trim())
        );

        return NextResponse.json({
          leads: submissions ?? [],
          registrations: registrationsOnly,
        });
      }
    }
  } catch {
    // fall through to in-memory
  }

  // Fallback: in-memory store only (no student table available locally)
  const leads = Array.from(submissionStore.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  return NextResponse.json({ leads, registrations: [] });
}
