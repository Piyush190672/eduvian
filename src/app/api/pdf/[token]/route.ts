import { NextRequest, NextResponse } from "next/server";
import { recommendPrograms } from "@/lib/scoring";
import { INDEXED_PROGRAMS, resolveProgramId } from "@/data/programs-indexed";
import { submissionStore } from "@/lib/store";
import type { Program, StudentProfile, ScoredProgram } from "@/lib/types";
import { intendedFieldLabel } from "@/lib/types";
import { getTierLabel, formatCurrency, getCountryFlag } from "@/lib/utils";
import { scoreStudentProfile, categoryBadgeHtml } from "@/lib/profile-score";
import { escHtml } from "@/lib/html-escape";
import { decryptProfile } from "@/lib/submissions-decrypt";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isSubmissionOwner, isEmailRegistered, redactProfileContact } from "@/lib/submission-owner";
import { captureApiError } from "@/lib/api-error";

// PDF render = decrypt profile + score 8k+ programs + emit ~10KB HTML.
// Cold-start scoring across 8,007 programs can exceed Vercel's 10s default
// on the free tier. Bump to 30s to match /api/pdf/tools, well above the
// observed render time.
export const maxDuration = 30;

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    // M8: cap PDF renders (30/h per IP) — HTML→PDF render is CPU-heavy.
    const ip = getClientIp(req.headers);
    const rl = await checkRateLimit(`pdf-token:${ip}`, 30, 3600);
    if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } });

    const { token } = params;

    // Read shortlisted IDs from query param first (most up-to-date)
    const idsParam = req.nextUrl.searchParams.get("ids");
    const queryIds = idsParam ? idsParam.split(",").filter(Boolean) : [];

    // Try in-memory store first, fall back to Supabase
    let submission: { profile: StudentProfile; shortlisted_ids: string[] } | null =
      submissionStore.get(token) ?? null;

    if (!submission) {
      try {
        const { createServiceClient } = await import("@/lib/supabase");
        const supabase = createServiceClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("submissions")
            .select("*")
            .eq("token", token)
            .single();
          if (error) {
            console.warn("[pdf/token] Supabase lookup error:", error.message);
          }
          if (data) submission = data;
        }
      } catch (e) {
        console.warn("[pdf/token] Supabase exception:", (e as Error)?.message ?? e);
      }
    }

    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // H7: prefer encrypted profile; fall back to plaintext.
    const rawProfile = decryptProfile(submission as { profile?: unknown; profile_encrypted?: string | null }) as StudentProfile;
    if (!rawProfile) {
      return NextResponse.json({ error: "Profile data unavailable" }, { status: 500 });
    }

    // Same contact-PII gate as /api/results (Phase 1 item 5) — the PDF
    // renders email + phone in its header, so an unredacted PDF would
    // bypass the results-route redaction entirely. Shared-link viewers
    // get a masked header; the report content is unaffected.
    const owner = await isSubmissionOwner(
      req,
      (submission as { email_hash?: string | null }).email_hash,
    );
    const profile = owner ? rawProfile : redactProfileContact(rawProfile);

    // Prefer query param IDs, fall back to stored, then top 20
    const shortlistedIds =
      queryIds.length > 0 ? queryIds : (submission.shortlisted_ids ?? []);

    const programs: Program[] = INDEXED_PROGRAMS;

    const scored = recommendPrograms(profile, programs);
    // Stored ids may be legacy positional (prog_N) — translate to the
    // stable content-hash ids before filtering.
    const wantedIds = new Set(
      shortlistedIds
        .map((id: string) => resolveProgramId(id)?.id ?? id)
        .filter(Boolean),
    );
    const shortlisted =
      wantedIds.size > 0
        ? scored.filter((p) => wantedIds.has(p.id))
        : scored.slice(0, 20);

    // Registration gate (Phase 2 #7, hardened per user 10 July 2026):
    // guests get NO PDF at all — not even a teaser. This route opens in
    // a new tab, so the refusal is a small human-readable page with a
    // register link rather than raw JSON. Keyed on registration, not
    // ownership — guest submitters carry an owner session cookie from
    // /api/submit.
    if (!(await isEmailRegistered(rawProfile.email))) {
      return new NextResponse(
        `<!doctype html><html><head><title>Register to unlock your PDF</title><meta name="robots" content="noindex"></head>
<body style="font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;padding:0 24px;color:#111827;">
  <h1 style="font-size:22px;">Your PDF report is waiting</h1>
  <p style="color:#4b5563;line-height:1.6;">Create a free account with the same email you used on the form to download the full PDF report and unlock all your matches.</p>
  <a href="/get-started?next=/results/${encodeURIComponent(token)}" style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:999px;font-weight:700;text-decoration:none;">Register free</a>
</body></html>`,
        { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    const html = buildPDFHtml(profile, shortlisted);

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Always re-render so the user gets the latest shortlist state, and
        // so a one-time render failure doesn't get cached by a CDN edge.
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err) {
    captureApiError(err, { route: "pdf/[token]" });
    return NextResponse.json(
      { error: "PDF generation failed. Please try again in a moment." },
      { status: 500 },
    );
  }
}

function buildPDFHtml(profile: StudentProfile, programs: ScoredProgram[]): string {
  const profileScore = scoreStudentProfile(profile);
  const badgeHtml = categoryBadgeHtml(profileScore.category);

  // Parameters considered — labels only, no scoring details surfaced to the
  // user. Keeps the family/parent reader focused on which factors went into
  // the assessment without exposing the underlying point allocation.
  const criteriaRows = profileScore.criteria
    .map((c) => {
      const bg    = "#f8fafc";
      const bdr   = "#e2e8f0";
      const color = "#334155";
      return `<span style="display:inline-flex;align-items:center;gap:6px;background:${bg};border:1px solid ${bdr};border-radius:8px;padding:5px 10px;font-size:11px;color:${color};">• ${escHtml(c.label)}</span>`;
    })
    .join("");

  const rows = programs
    .map(
      (p) => `
    <tr>
      <td>
        <div class="prog-name">${escHtml(getCountryFlag(p.country))} ${escHtml(p.program_name)}</div>
        <div class="uni-name">${escHtml(p.university_name)} · ${escHtml(p.city)}</div>
      </td>
      <td class="center">
        <span class="tier-badge tier-${escHtml(p.tier)}">${escHtml(getTierLabel(p.tier))}</span>
      </td>
      <td class="center score">${escHtml(p.match_score)}%</td>
      <td class="right">${escHtml(formatCurrency(p.annual_tuition_usd + p.avg_living_cost_usd))}/yr</td>
      <td class="right">${escHtml((() => {
        const dl = p.application_deadline;
        if (!dl) return "—";
        if (dl === "rolling") return "Rolling";
        const today = new Date(); today.setHours(0,0,0,0);
        const d = new Date(dl); d.setHours(0,0,0,0);
        if (d < today) return "App. process not started";
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      })())}</td>
      <td class="center">${p.qs_ranking ? `#${escHtml(p.qs_ranking)}` : "—"}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>eduvianAI Profile — ${escHtml(profile.full_name)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e1b4b; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #e0e7ff; }
  .brand { font-size: 24px; font-weight: 900; background: linear-gradient(135deg,#6366f1,#8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .student-info { font-size: 13px; color: #6b7280; text-align: right; }
  .student-info strong { color: #1e1b4b; display: block; font-size: 16px; }
  .profile-box { background: #f8fafc; border: 1.5px solid #e0e7ff; border-radius: 14px; padding: 20px 24px; margin-bottom: 28px; }
  .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-top: 12px; font-size: 13px; color: #374151; }
  .profile-grid span { color: #9ca3af; font-size: 11px; display: block; }
  .criteria-wrap { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
  h2 { font-size: 18px; font-weight: 800; margin-bottom: 14px; color: #1e1b4b; }
  h3 { font-size: 15px; font-weight: 700; color: #1e1b4b; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead { background: #f0f4ff; }
  th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 700; }
  td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  .prog-name { font-weight: 700; color: #1e1b4b; }
  .uni-name { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .tier-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .tier-safe { background: #d1fae5; color: #065f46; }
  .tier-reach { background: #fef3c7; color: #92400e; }
  .tier-ambitious { background: #fff7ed; color: #c2410c; }
  .score { font-weight: 800; color: #4f46e5; font-size: 15px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e0e7ff; font-size: 12px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div style="display:flex;align-items:center;gap:10px;">
      <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="eduvianAI">
        <defs><linearGradient id="g1" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6366F1"/><stop offset="1" stop-color="#A855F7"/></linearGradient></defs>
        <rect width="36" height="36" rx="10" fill="url(#g1)"/>
        <ellipse cx="18" cy="18" rx="11" ry="6" stroke="#ffffff" stroke-width="1.2" stroke-opacity="0.4" fill="none" transform="rotate(-30 18 18)"/>
        <text x="18" y="23.5" text-anchor="middle" fill="#ffffff" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif" font-size="16" font-weight="800" letter-spacing="-1">e</text>
        <circle cx="26.5" cy="11.5" r="2" fill="#ffffff" fill-opacity="0.9"/>
      </svg>
      <div style="font-size:12px;font-weight:600;color:#9ca3af;">Independent study-abroad intelligence</div>
    </div>
    <div class="student-info">
      <strong>${escHtml(profile.full_name)}</strong>
      ${escHtml(profile.email)}${profile.phone ? ` · ${escHtml(profile.phone)}` : ""}
      <div style="margin-top:2px;">Generated ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}</div>
    </div>
  </div>

  <!-- Profile Summary Box -->
  <div class="profile-box">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
      <h3 style="margin:0;">Student Profile</h3>
      ${badgeHtml}
    </div>
    <div class="profile-grid">
      <div><span>Degree Level</span>${profile.degree_level === "postgraduate" ? "Postgraduate" : "Undergraduate"}</div>
      <div><span>Field of Study</span>${escHtml(intendedFieldLabel(profile))}</div>
      <div><span>Nationality</span>${escHtml(profile.nationality)}${profile.city ? ` · ${escHtml(profile.city)}` : ""}</div>
      <div><span>Target Intake</span>${escHtml(profile.target_intake_semester)} ${escHtml(profile.target_intake_year)}</div>
      <div><span>Academic Score</span>${escHtml(profile.academic_score)}${profile.academic_score_type === "gpa" ? " / 4.0 GPA" : profile.academic_score_type === "cgpa_10" ? " / 10 CGPA" : profile.academic_score_type === "ib" ? " / 45 IB" : "%"}</div>
      <div><span>English Test</span>${profile.english_test !== "none" ? `${escHtml(String(profile.english_test).toUpperCase())} ${escHtml(profile.english_score_overall ?? "")}` : "Not taken"}</div>
    </div>
    <!-- Criteria checklist -->
    <div style="margin-top:16px;border-top:1px solid #e0e7ff;padding-top:14px;">
      <div style="font-size:12px;font-weight:700;color:#6b7280;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.4px;">Parameters Considered</div>
      <div class="criteria-wrap">${criteriaRows}</div>
    </div>
  </div>

  <!-- Shortlist Table -->
  <h2>Your Shortlist (${programs.length} programs)</h2>
  <table>
    <thead>
      <tr>
        <th>Program</th>
        <th class="center">Tier</th>
        <th class="center">Match</th>
        <th class="right">Annual Cost</th>
        <th class="right">Deadline</th>
        <th class="center">QS Rank</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="footer">
    Generated by eduvianAI · eduvianai.com
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`;
}
