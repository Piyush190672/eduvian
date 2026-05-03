import { NextRequest, NextResponse } from "next/server";
import type { StudentProfile, Program, ScoredProgram } from "@/lib/types";
import { getUserFromRequest } from "@/lib/user-cookie";
import { checkBetaAccess, logToolUsage } from "@/lib/beta-gate";
import { getClientIp, aiToolLimit } from "@/lib/rate-limit";
import { decryptProfile, SUBMISSION_PROFILE_COLUMNS } from "@/lib/submissions-decrypt";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("token");
  const query = (searchParams.get("q") ?? "").trim().toLowerCase();

  if (!token) {
    return NextResponse.json({ error: "token required" }, { status: 400 });
  }

  // Load student profile from token
  let profile: StudentProfile | null = null;

  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase
        .from("submissions")
        .select(SUBMISSION_PROFILE_COLUMNS)
        .eq("token", token)
        .single();
      if (data) {
        // H7: prefer encrypted blob; fall back to plaintext.
        const decrypted = decryptProfile(data as { profile?: unknown; profile_encrypted?: string | null });
        if (decrypted) profile = decrypted as StudentProfile;
      }
    }
  } catch { /* fall through */ }

  if (!profile) {
    const { submissionStore } = await import("@/lib/store");
    const stored = submissionStore.get(token);
    if (stored?.profile) profile = stored.profile as StudentProfile;
  }

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // ── Beta gate: identify user via profile email or fall back to cookie ──
  const profileEmail = (profile.email ?? "").toLowerCase().trim();
  let gateEmail: string | null = profileEmail || null;
  if (!gateEmail) {
    const user = await getUserFromRequest(req);
    gateEmail = user?.email ?? null;
  }

  if (!gateEmail) {
    return NextResponse.json(
      { error: "Please register to continue.", reason: "no_user" },
      { status: 401 }
    );
  }

  const gate = await checkBetaAccess(gateEmail, "check-match");
  if (!gate.allowed) {
    return NextResponse.json(
      { error: gate.message, reason: gate.reason },
      { status: gate.reason === "no_user" ? 401 : 403 }
    );
  }
  const limited = await aiToolLimit(req, "check-match", gateEmail, { limit: 30 });
  if (limited) return limited;

  // Load all programs
  const { PROGRAMS } = await import("@/data/programs");
  const { scoreProgram } = await import("@/lib/scoring");

  const allPrograms: Program[] = (PROGRAMS as unknown[]).map((p, i) => ({
    ...(p as object),
    id: `prog_${i}`,
    is_active: true,
    last_updated: new Date().toISOString(),
  })) as Program[];

  // Try DB programs
  let programs = allPrograms;
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      const { data } = await supabase.from("programs").select("*").eq("is_active", true);
      if (data && data.length > 0) programs = data as Program[];
    }
  } catch { /* use static */ }

  // Filter by query if provided
  let filtered = programs;
  if (query.length >= 2) {
    filtered = programs.filter((p) =>
      p.university_name.toLowerCase().includes(query) ||
      p.program_name.toLowerCase().includes(query) ||
      p.country.toLowerCase().includes(query) ||
      p.city?.toLowerCase().includes(query) ||
      p.field_of_study.toLowerCase().includes(query)
    );
  }

  // Score filtered programs
  const scored: ScoredProgram[] = filtered
    .map((p) => scoreProgram(profile!, p))
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 15);

  // Log usage (best-effort)
  await logToolUsage(gateEmail, "check-match", getClientIp(req.headers));

  return NextResponse.json({ results: scored });
}
