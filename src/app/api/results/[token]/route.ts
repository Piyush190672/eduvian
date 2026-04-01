import { NextRequest, NextResponse } from "next/server";
import { recommendPrograms } from "@/lib/scoring";
import { PROGRAMS } from "@/data/programs";
import { submissionStore } from "@/lib/store";
import type { Program } from "@/lib/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  // Try Supabase
  let submission = null;
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("token", token)
        .single();
      if (!error && data) submission = data;
    }
  } catch {
    // fall through
  }

  // Fall back to in-memory
  if (!submission) {
    submission = submissionStore.get(token) ?? null;
  }

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  // Get programs
  let programs: Program[] = PROGRAMS.map((p, i) => ({
    ...p,
    id: `prog_${i}`,
    is_active: true,
    last_updated: new Date().toISOString(),
  }));

  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase.from("programs").select("*").eq("is_active", true);
      if (data && data.length > 0) programs = data as Program[];
    }
  } catch {
    // use static
  }

  const scored = recommendPrograms(submission.profile, programs);

  return NextResponse.json({ submission, programs: scored });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;
  const { shortlisted_ids } = await req.json();

  // Update Supabase
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      await supabase
        .from("submissions")
        .update({ shortlisted_ids })
        .eq("token", token);
    }
  } catch {
    // fall through
  }

  // Update in-memory
  const existing = submissionStore.get(token);
  if (existing) {
    submissionStore.set(token, { ...existing, shortlisted_ids });
  }

  return NextResponse.json({ ok: true });
}
