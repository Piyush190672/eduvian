import { NextRequest, NextResponse } from "next/server";
import { recommendPrograms } from "@/lib/scoring";
import { PROGRAMS } from "@/data/programs";
import { submissionStore } from "@/lib/store";
import type { Program, StudentProfile, ScoredProgram } from "@/lib/types";
import { getTierLabel, formatCurrency, getCountryFlag } from "@/lib/utils";
import { scoreStudentProfile, categoryBadgeHtml } from "@/lib/profile-score";
import { escHtml } from "@/lib/html-escape";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
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
        const { data } = await supabase
          .from("submissions")
          .select("*")
          .eq("token", token)
          .single();
        if (data) submission = data;
      }
    } catch {
      // ignore
    }
  }

  if (!submission) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile = submission.profile as StudentProfile;

  // Prefer query param IDs, fall back to stored, then top 20
  const shortlistedIds =
    queryIds.length > 0 ? queryIds : (submission.shortlisted_ids ?? []);

  const programs: Program[] = PROGRAMS.map((p, i) => ({
    ...p,
    id: `prog_${i}`,
    is_active: true,
    last_updated: new Date().toISOString(),
  }));

  const scored = recommendPrograms(profile, programs);
  const shortlisted =
    shortlistedIds.length > 0
      ? scored.filter((p) => shortlistedIds.includes(p.id))
      : scored.slice(0, 20);

  const html = buildPDFHtml(profile, shortlisted);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

function buildPDFHtml(profile: StudentProfile, programs: ScoredProgram[]): string {
  const profileScore = scoreStudentProfile(profile);
  const badgeHtml = categoryBadgeHtml(profileScore.category);

  const criteriaRows = profileScore.criteria
    .map((c) => {
      const full = c.points === c.maxPoints;
      const partial = c.partial;
      const bg    = full ? "#f0fdf4" : partial ? "#fffbeb" : "#fef2f2";
      const bdr   = full ? "#bbf7d0" : partial ? "#fde68a" : "#fecaca";
      const color = full ? "#166534" : partial ? "#92400e" : "#991b1b";
      const icon  = full ? "✓" : partial ? "~" : "✗";
      const pts   = c.maxPoints > 1 ? ` (${c.points}/${c.maxPoints})` : "";
      return `<span style="display:inline-flex;align-items:center;gap:6px;background:${bg};border:1px solid ${bdr};border-radius:8px;padding:5px 10px;font-size:11px;color:${color};">${icon} ${escHtml(c.label)}${escHtml(pts)}</span>`;
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
    <div>
      <div class="brand">🌍 eduvianAI</div>
      <div style="font-size:12px;font-weight:600;color:#9ca3af;margin-top:2px;">Your Global Future, Simplified</div>
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
      <div><span>Field of Study</span>${escHtml(profile.intended_field)}</div>
      <div><span>Nationality</span>${escHtml(profile.nationality)}${profile.city ? ` · ${escHtml(profile.city)}` : ""}</div>
      <div><span>Target Intake</span>${escHtml(profile.target_intake_semester)} ${escHtml(profile.target_intake_year)}</div>
      <div><span>Academic Score</span>${escHtml(profile.academic_score)}${profile.academic_score_type === "gpa" ? " / 4.0 GPA" : "%"}</div>
      <div><span>English Test</span>${profile.english_test !== "none" ? `${escHtml(String(profile.english_test).toUpperCase())} ${escHtml(profile.english_score_overall ?? "")}` : "Not taken"}</div>
    </div>
    <!-- Criteria checklist -->
    <div style="margin-top:16px;border-top:1px solid #e0e7ff;padding-top:14px;">
      <div style="font-size:12px;font-weight:700;color:#6b7280;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.4px;">Profile Criteria Assessment</div>
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
