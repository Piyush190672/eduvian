import { NextRequest, NextResponse } from "next/server";
import { recommendPrograms } from "@/lib/scoring";
import { PROGRAMS } from "@/data/programs";
import { submissionStore } from "@/lib/store";
import type { Program, StudentProfile, ScoredProgram } from "@/lib/types";
import { getTierLabel, formatCurrency, getCountryFlag } from "@/lib/utils";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

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
  const shortlistedIds = submission.shortlisted_ids ?? [];

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
  const rows = programs
    .map(
      (p) => `
    <tr>
      <td>
        <div class="prog-name">${getCountryFlag(p.country)} ${p.program_name}</div>
        <div class="uni-name">${p.university_name} · ${p.city}</div>
      </td>
      <td class="center">
        <span class="tier-badge tier-${p.tier}">${getTierLabel(p.tier)}</span>
      </td>
      <td class="center score">${p.match_score}%</td>
      <td class="right">${formatCurrency(p.annual_tuition_usd + p.avg_living_cost_usd)}/yr</td>
      <td class="right">${p.application_deadline === "rolling" ? "Rolling" : p.application_deadline ?? "—"}</td>
      <td class="center">${p.qs_ranking ? `#${p.qs_ranking}` : "—"}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Eduvian Shortlist — ${profile.full_name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e1b4b; background: #fff; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #e0e7ff; }
  .brand { font-size: 24px; font-weight: 900; background: linear-gradient(135deg,#6366f1,#8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
  .student-info { font-size: 13px; color: #6b7280; text-align: right; }
  .student-info strong { color: #1e1b4b; display: block; font-size: 16px; }
  h2 { font-size: 20px; font-weight: 800; margin-bottom: 16px; color: #1e1b4b; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  thead { background: #f0f4ff; }
  th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; font-weight: 700; }
  td { padding: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
  tr:hover td { background: #fafafa; }
  .prog-name { font-weight: 700; color: #1e1b4b; }
  .uni-name { font-size: 12px; color: #6b7280; margin-top: 2px; }
  .tier-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; }
  .tier-safe { background: #d1fae5; color: #065f46; }
  .tier-reach { background: #fef3c7; color: #92400e; }
  .tier-ambitious { background: #fee2e2; color: #991b1b; }
  .score { font-weight: 800; color: #4f46e5; font-size: 15px; }
  .center { text-align: center; }
  .right { text-align: right; }
  .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #e0e7ff; font-size: 12px; color: #9ca3af; text-align: center; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">🌍 Eduvian</div>
    <div style="font-size:11px;color:#6b7280;margin-top:2px;">Your Global Future, Simplified</div>
    <div class="student-info">
      <strong>${profile.full_name}</strong>
      ${profile.email} · Generated ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
    </div>
  </div>
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
    Generated by Eduvian · eduvian.com
  </div>
  <script>window.onload = () => window.print()</script>
</body>
</html>`;
}
