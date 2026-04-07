import { NextRequest, NextResponse } from "next/server";
import type { ScoredProgram, StudentProfile, Program } from "@/lib/types";
import { formatCurrency, getTierLabel } from "@/lib/utils";
import { scoreStudentProfile, getCategoryStyle, categoryBadgeHtml } from "@/lib/profile-score";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, shortlisted_ids } = body as {
      token: string;
      shortlisted_ids?: string[];
    };

    // Look up submission from Supabase or in-memory store
    let submission: { profile?: StudentProfile; [key: string]: unknown } | null = null;
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
    } catch { /* fall through */ }

    if (!submission) {
      const { submissionStore } = await import("@/lib/store");
      const stored = submissionStore.get(token);
      if (stored) submission = stored as unknown as { profile?: StudentProfile; [key: string]: unknown };
    }

    const profile = submission?.profile as StudentProfile | undefined;

    // Generate scored programs
    let allPrograms: ScoredProgram[] = [];
    if (profile) {
      try {
        const { PROGRAMS } = await import("@/data/programs");
        const { recommendPrograms } = await import("@/lib/scoring");

        let rawPrograms: Program[] = (PROGRAMS as unknown[]).map((p, i) => ({
          ...(p as object),
          id: `prog_${i}`,
          is_active: true,
          last_updated: new Date().toISOString(),
        })) as Program[];

        try {
          const { createServiceClient } = await import("@/lib/supabase");
          const supabase = createServiceClient();
          if (supabase) {
            const { data } = await supabase.from("programs").select("*").eq("is_active", true);
            if (data && data.length > 0) rawPrograms = data as Program[];
          }
        } catch { /* use static */ }

        allPrograms = recommendPrograms(profile, rawPrograms);
      } catch { /* ignore */ }
    }

    // Filter to shortlisted only, otherwise fall back to top 8
    let programs: ScoredProgram[];
    if (shortlisted_ids && shortlisted_ids.length > 0) {
      const idSet = new Set(shortlisted_ids);
      const filtered = allPrograms.filter((p) => idSet.has(p.id));
      programs = filtered.length > 0 ? filtered : allPrograms.slice(0, 8);
    } else {
      programs = allPrograms.slice(0, 8);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.eduvianai.com";
    const resultsUrl = `${appUrl}/results/${token}`;

    // Profile score section
    const profileScoreSection = profile ? (() => {
      const ps = scoreStudentProfile(profile);
      const style = getCategoryStyle(ps.category);
      const badge = categoryBadgeHtml(ps.category);
      const passed = ps.criteria.filter(c => c.passed);
      const failed = ps.criteria.filter(c => !c.passed);
      return `
      <div style="background:#f8fafc;border:1.5px solid #e0e7ff;border-radius:14px;padding:20px 24px;margin-bottom:24px;">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
          <div style="font-weight:700;color:#1e1b4b;font-size:15px;">Your Profile Assessment</div>
          ${badge}
        </div>
        <p style="color:#6b7280;font-size:13px;margin:0 0 14px;line-height:1.5;">${style.description}</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${passed.map(c => `<span style="display:inline-block;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:4px 10px;font-size:11px;color:#166534;">✓ ${c.label}</span>`).join("")}
          ${failed.map(c => `<span style="display:inline-block;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:4px 10px;font-size:11px;color:#991b1b;">✗ ${c.label}</span>`).join("")}
        </div>
      </div>`;
    })() : "";

    const programRows = programs
      .map(
        (p) => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:12px 8px;">
          <div style="font-weight:600;color:#1e1b4b;font-size:14px;">${p.program_name}</div>
          <div style="color:#6b7280;font-size:12px;margin-top:2px;">${p.university_name} · ${p.country}</div>
        </td>
        <td style="padding:12px 8px;text-align:center;">
          <span style="background:${p.tier === "safe" ? "#d1fae5" : p.tier === "reach" ? "#fef3c7" : "#fff7ed"};color:${p.tier === "safe" ? "#065f46" : p.tier === "reach" ? "#92400e" : "#c2410c"};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:600;">${getTierLabel(p.tier)}</span>
        </td>
        <td style="padding:12px 8px;text-align:right;font-weight:700;color:#4f46e5;font-size:14px;">${p.match_score}%</td>
        <td style="padding:12px 8px;text-align:right;color:#6b7280;font-size:13px;">${formatCurrency(p.annual_tuition_usd + p.avg_living_cost_usd)}/yr</td>
      </tr>`
      )
      .join("");

    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);padding:40px 32px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">🌍 eduvianAI</div>
      <div style="color:#e0e7ff;margin-top:4px;font-size:15px;font-weight:700;letter-spacing:0.3px;">Your Global Future, Simplified</div>
      <div style="color:#e0e7ff;margin-top:8px;font-size:15px;">Your personalized shortlist is ready</div>
    </div>

    <div style="padding:32px;">
      <h2 style="color:#1e1b4b;font-size:22px;font-weight:800;margin:0 0 8px;">
        Hey ${profile?.full_name?.split(" ")[0] ?? "there"}! 👋
      </h2>
      <p style="color:#6b7280;margin:0 0 24px;line-height:1.6;">
        Here ${programs.length === 1 ? "is" : "are"} your <strong>${programs.length} shortlisted program${programs.length === 1 ? "" : "s"}</strong> — ranked by how well they match <strong>you</strong>.
      </p>

      ${profileScoreSection}

      <div style="text-align:center;margin:24px 0;">
        <a href="${resultsUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:16px;">
          View Full Shortlist →
        </a>
        <div style="color:#9ca3af;font-size:12px;margin-top:8px;">Bookmark this email — your link is permanent</div>
      </div>

      ${programs.length > 0 ? `
      <h3 style="color:#1e1b4b;font-size:16px;font-weight:700;margin:24px 0 12px;">Your Shortlisted Programs</h3>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px 8px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Program</th>
            <th style="padding:10px 8px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Tier</th>
            <th style="padding:10px 8px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Match</th>
            <th style="padding:10px 8px;text-align:right;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Cost/yr</th>
          </tr>
        </thead>
        <tbody>${programRows}</tbody>
      </table>
      ` : ""}

      <div style="background:#f0f4ff;border-radius:12px;padding:20px;margin-top:24px;">
        <div style="font-weight:700;color:#4338ca;margin-bottom:8px;">💡 Next steps</div>
        <ul style="color:#6b7280;margin:0;padding-left:20px;line-height:2;">
          <li>Bookmark your Safe Match programs — apply to at least 3</li>
          <li>Add 1–2 Reach programs to aim high</li>
          <li>Check application deadlines — many are rolling</li>
          <li>Use your magic link to revisit or update your shortlist anytime</li>
        </ul>
      </div>
    </div>

    <div style="background:#f8fafc;padding:20px 32px;text-align:center;border-top:1px solid #f1f5f9;">
      <div style="color:#9ca3af;font-size:12px;">
        © 2025 eduvianAI · Your Global Future, Simplified<br>
        <a href="${resultsUrl}" style="color:#6366f1;text-decoration:none;">View your shortlist</a>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "results@eduvianai.com";

    if (!resendKey) {
      console.warn("RESEND_API_KEY not configured");
      return NextResponse.json({ ok: true, warning: "Email service not configured" });
    }

    if (!profile?.email) {
      return NextResponse.json({ error: "No recipient email found" }, { status: 400 });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(resendKey);

    await resend.emails.send({
      from: `eduvianAI <${fromEmail}>`,
      to: profile.email,
      subject: `🎓 Your eduvianAI shortlist — ${programs.length} program${programs.length === 1 ? "" : "s"} saved`,
      html: htmlBody,
    });

    // Mark email sent in Supabase
    try {
      const { createServiceClient } = await import("@/lib/supabase");
      const supabase = createServiceClient();
      if (supabase) {
        await supabase
          .from("submissions")
          .update({ email_sent: true })
          .eq("token", token);
      }
    } catch { /* ignore */ }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Email error:", err);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}
