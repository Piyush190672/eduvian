import { NextResponse } from "next/server";
import { submissionStore } from "@/lib/store";
import { decryptProfile } from "@/lib/submissions-decrypt";

export async function GET() {
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      // Fetch full-profile submissions (include H7 shadow columns).
      const { data: submissions, error: subErr } = await supabase
        .from("submissions")
        .select("id, token, profile, profile_encrypted, email_hash, profile_category, total_matched, shortlisted_ids, email_sent, created_at")
        .order("created_at", { ascending: false });

      // Fetch all registered students
      const { data: students, error: stuErr } = await supabase
        .from("students")
        .select("id, name, email, phone, source, source_stage, created_at")
        .order("created_at", { ascending: false });

      if (!subErr && !stuErr) {
        // Decrypt every submission's profile (encrypted preferred) and
        // strip the encrypted blob from the wire payload — admin doesn't
        // need it, and we never want it in the browser.
        const decryptedSubmissions = (submissions ?? []).map((s: Record<string, unknown>) => {
          const decrypted = decryptProfile(s as { profile?: unknown; profile_encrypted?: string | null });
          const out: Record<string, unknown> = { ...s, profile: decrypted };
          delete out.profile_encrypted;
          return out;
        });

        // Build set of emails that have a full submission
        const submittedEmails = new Set(
          decryptedSubmissions
            .map((s) => {
              const p = (s as { profile?: { email?: string } }).profile;
              return p?.email?.toLowerCase().trim();
            })
            .filter(Boolean)
        );

        // Students who registered but never completed the full profile form
        const registrationsOnly = (students ?? []).filter(
          (st: { email: string }) =>
            !submittedEmails.has(st.email?.toLowerCase().trim())
        );

        return NextResponse.json({
          leads: decryptedSubmissions,
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
