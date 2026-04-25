import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";

export const maxDuration = 30;

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtK(n: number): string {
  if (!isFinite(n) || n === 0) return "$0";
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}K` : `$${n.toFixed(0)}`;
}

function fmtYrs(y: number): string {
  if (!isFinite(y) || y > 30) return "30+ yrs";
  return y < 1 ? `${Math.round(y * 12)} mo` : `${y.toFixed(1)} yrs`;
}

function fmtUSD(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ROIData {
  university_name: string; flag: string; country: string; city: string;
  program_name: string; degree_level: string; field: string;
  qs_ranking?: number; duration_months: number; scholarship_usd: number;
  savings_rate_pct: number; expected_salary_usd: number;
  annual_tuition_usd: number; avg_living_cost_usd: number;
  total_tuition_usd: number; total_living_usd: number; total_investment_usd: number;
  monthly_budget_usd: number; monthly_savings_usd: number;
  payback_years: number; ten_year_roi_pct: number;
  breakeven_salary_usd: number; net_earnings_10yr_usd: number;
}

interface ParentData {
  university_name: string; flag: string; country: string; city: string;
  program_name: string; degree_level: string; field: string;
  qs_ranking?: number; duration_months: number; scholarship_usd: number; budget_usd: number;
  annual_tuition_usd: number; avg_living_cost_usd: number;
  total_pct: number; recommendation: string; recommendation_color: string; recommendation_icon: string;
  budget_fit_score: number; ranking_score: number; psw_score: number;
  job_market_score: number; financial_roi_score: number; safety_score: number; student_life_score: number;
  total_tuition_usd: number; total_living_usd: number; total_cost_usd: number;
  net_cost_usd: number; expected_salary_usd: number; payback_years: number; roi_positive: boolean;
  psw_available: boolean; psw_duration: string; psw_note: string;
  job_market_rating: string; job_market_detail: string;
  safety_rating: string; safety_detail: string;
  student_life_rating: string; student_life_detail: string;
}

// ── Shared email shell ────────────────────────────────────────────────────────

function emailShell(preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>eduvianAI Results</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;background:#f8fafc;margin:0;padding:20px;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899);padding:36px 32px;text-align:center;">
      <img src="https://www.eduvianai.com/logo.svg" width="48" height="48" alt="eduvianAI" style="display:block;margin:0 auto 10px;border:0;outline:none;" />
      <div style="font-size:26px;font-weight:900;color:#fff;letter-spacing:-0.5px;">eduvianAI</div>
      <div style="color:#e0e7ff;font-size:13px;font-weight:600;margin-top:3px;">Your Global Future, Simplified</div>
    </div>
    <!-- Body -->
    <div style="padding:28px 32px 24px;">
      ${body}
    </div>
    <!-- Footer -->
    <div style="background:#f8fafc;border-top:1px solid #f1f5f9;padding:16px 32px;text-align:center;">
      <div style="color:#9ca3af;font-size:11px;line-height:1.6;">
        © 2025 eduvianAI · Your Global Future, Simplified<br/>
        Salary figures are median graduate outcomes. All amounts in USD. For informational purposes only.<br/>
        <a href="https://www.eduvianai.com" style="color:#6366f1;text-decoration:none;">www.eduvianai.com</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── ROI email body ────────────────────────────────────────────────────────────

function buildROIEmail(d: ROIData): string {
  const roiSign = d.ten_year_roi_pct >= 0 ? "+" : "";
  const gainSign = d.net_earnings_10yr_usd >= 0 ? "+" : "";
  const paybackOk = d.payback_years <= 8;
  const breakevenOk = d.expected_salary_usd >= d.breakeven_salary_usd;

  const metricCard = (label: string, value: string, color: string = "#1e1b4b") => `
    <td style="width:25%;padding:12px 8px;text-align:center;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;">
      <div style="font-size:10px;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">${label}</div>
      <div style="font-size:20px;font-weight:900;color:${color};line-height:1;">${value}</div>
    </td>`;

  return `
    <h2 style="color:#1e1b4b;font-size:20px;font-weight:800;margin:0 0 6px;">Your ROI Analysis</h2>
    <p style="color:#6b7280;font-size:13px;margin:0 0 20px;line-height:1.5;">
      Here are the full financial results for your selected program.
    </p>

    <!-- Program card -->
    <div style="background:#f0f4ff;border:1.5px solid #c7d2fe;border-radius:12px;padding:14px 18px;margin-bottom:20px;display:flex;align-items:flex-start;gap:12px;">
      <div style="font-size:26px;line-height:1;flex-shrink:0;">${d.flag || "🎓"}</div>
      <div>
        <div style="font-size:15px;font-weight:800;color:#1e1b4b;">${d.program_name}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:3px;line-height:1.6;">
          ${d.university_name}${d.qs_ranking ? ` · QS #${d.qs_ranking}` : ""}  ·  ${d.city || d.country}, ${d.country}<br/>
          ${d.degree_level}  ·  ${(d.duration_months / 12).toFixed(1)} years${d.scholarship_usd > 0 ? ` · ${fmtK(d.scholarship_usd)} scholarship` : ""}
        </div>
      </div>
    </div>

    <!-- Key metrics -->
    <table style="width:100%;border-collapse:separate;border-spacing:6px;margin-bottom:20px;">
      <tr>
        ${metricCard("Total Investment", fmtK(d.total_investment_usd))}
        ${metricCard("Payback Period", fmtYrs(d.payback_years), paybackOk ? "#059669" : "#d97706")}
        ${metricCard("10-Year ROI", `${roiSign}${Math.round(d.ten_year_roi_pct)}%`, d.ten_year_roi_pct >= 0 ? "#059669" : "#dc2626")}
        ${metricCard("10-yr Net Gain", `${gainSign}${fmtK(d.net_earnings_10yr_usd)}`, d.net_earnings_10yr_usd >= 0 ? "#059669" : "#dc2626")}
      </tr>
    </table>

    <!-- Cost breakdown -->
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:#6366f1;margin-bottom:8px;padding-bottom:5px;border-bottom:1.5px solid #e0e7ff;">Cost Breakdown</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="background:#f8fafc;"><th style="padding:8px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;">Item</th><th style="padding:8px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;">Amount</th></tr>
        <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 8px;font-size:12px;color:#6b7280;">Annual Tuition</td><td style="padding:9px 8px;text-align:right;font-weight:700;color:#4f46e5;">${fmtUSD(d.annual_tuition_usd)}</td></tr>
        <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 8px;font-size:12px;color:#6b7280;">Annual Living Costs</td><td style="padding:9px 8px;text-align:right;font-weight:700;color:#4f46e5;">${fmtUSD(d.avg_living_cost_usd)}</td></tr>
        <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 8px;font-size:12px;color:#6b7280;">Total Tuition (${(d.duration_months / 12).toFixed(1)} yrs)</td><td style="padding:9px 8px;text-align:right;font-weight:700;color:#1e1b4b;">${fmtUSD(d.total_tuition_usd)}</td></tr>
        <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 8px;font-size:12px;color:#6b7280;">Total Living Costs</td><td style="padding:9px 8px;text-align:right;font-weight:700;color:#1e1b4b;">${fmtUSD(d.total_living_usd)}</td></tr>
        ${d.scholarship_usd > 0 ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 8px;font-size:12px;color:#6b7280;">Scholarship</td><td style="padding:9px 8px;text-align:right;font-weight:700;color:#059669;">−${fmtUSD(d.scholarship_usd)}</td></tr>` : ""}
        <tr style="background:#f0f4ff;"><td style="padding:9px 8px;font-size:12px;font-weight:700;color:#1e1b4b;">Net Investment</td><td style="padding:9px 8px;text-align:right;font-weight:900;color:#1e1b4b;font-size:14px;">${fmtUSD(d.total_investment_usd)}</td></tr>
      </table>
    </div>

    <!-- Break-even insight -->
    <div style="background:${breakevenOk ? "#f0fdf4" : "#fffbeb"};border:1.5px solid ${breakevenOk ? "#bbf7d0" : "#fde68a"};border-radius:10px;padding:14px 16px;margin-bottom:20px;">
      <div style="font-size:11px;font-weight:800;color:${breakevenOk ? "#065f46" : "#92400e"};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Break-even Analysis</div>
      <p style="font-size:12px;color:#374151;line-height:1.6;margin:0;">
        Minimum salary needed (5-year recovery at ${d.savings_rate_pct}% savings): <strong>${fmtUSD(d.breakeven_salary_usd)}/yr</strong><br/>
        Your expected salary: <strong>${fmtUSD(d.expected_salary_usd)}/yr</strong><br/>
        ${breakevenOk
          ? `<span style="color:#059669;font-weight:700;">✓ Your salary exceeds the break-even threshold.</span>`
          : `<span style="color:#d97706;font-weight:700;">⚠ Gap of ${fmtUSD(d.breakeven_salary_usd - d.expected_salary_usd)}/yr — consider scholarships or higher-earning specialisations.</span>`}
      </p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-top:16px;">
      <a href="https://www.eduvianai.com/get-started" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:13px 32px;border-radius:12px;font-weight:700;font-size:14px;">Find Programs That Maximise Your ROI →</a>
    </div>`;
}

// ── Parent email body ─────────────────────────────────────────────────────────

function buildParentEmail(d: ParentData): string {
  const rc = d.recommendation_color;
  const recColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    emerald: { bg: "#f0fdf4", border: "#bbf7d0", text: "#065f46", badge: "#059669" },
    amber:   { bg: "#fffbeb", border: "#fde68a", text: "#92400e", badge: "#d97706" },
    rose:    { bg: "#fff1f2", border: "#fecdd3", text: "#be123c", badge: "#e11d48" },
  };
  const rcc = recColors[rc] ?? recColors.amber;

  const scores = [
    { label: "Budget Fit",      score: d.budget_fit_score,    max: 20 },
    { label: "QS Ranking",      score: d.ranking_score,       max: 15 },
    { label: "Post-Study Work", score: d.psw_score,           max: 15 },
    { label: "Job Market",      score: d.job_market_score,    max: 15 },
    { label: "Financial ROI",   score: d.financial_roi_score, max: 15 },
    { label: "Safety",          score: d.safety_score,        max: 10 },
    { label: "Student Life",    score: d.student_life_score,  max: 10 },
  ];

  const scoreRow = ({ label, score, max }: { label: string; score: number; max: number }) => {
    const p = Math.round((score / max) * 100);
    const barColor = p >= 75 ? "#10b981" : p >= 50 ? "#f59e0b" : "#f43f5e";
    return `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:7px 8px;font-size:11px;color:#374151;font-weight:500;width:120px;">${label}</td>
        <td style="padding:7px 8px;">
          <div style="height:6px;background:#e5e7eb;border-radius:999px;overflow:hidden;">
            <div style="width:${p}%;height:100%;background:${barColor};border-radius:999px;"></div>
          </div>
        </td>
        <td style="padding:7px 8px;font-size:11px;font-weight:800;color:#1e1b4b;text-align:right;width:40px;">${score}/${max}</td>
      </tr>`;
  };

  const ratingBadge = (rating: string) => {
    const styles: Record<string, string> = {
      Excellent:  "background:#d1fae5;color:#065f46;",
      Good:       "background:#fef3c7;color:#92400e;",
      Concerning: "background:#fee2e2;color:#991b1b;",
    };
    return `<span style="display:inline-block;padding:2px 9px;border-radius:999px;font-size:10px;font-weight:700;${styles[rating] ?? ""}">${rating}</span>`;
  };

  const paybackClass = d.payback_years <= 8 ? "#059669" : d.payback_years <= 15 ? "#d97706" : "#dc2626";

  return `
    <h2 style="color:#1e1b4b;font-size:20px;font-weight:800;margin:0 0 6px;">Parent Decision Report</h2>
    <p style="color:#6b7280;font-size:13px;margin:0 0 20px;line-height:1.5;">
      Full data-driven verdict for your child's application.
    </p>

    <!-- Program card -->
    <div style="background:#f5f3ff;border:1.5px solid #ddd6fe;border-radius:12px;padding:14px 18px;margin-bottom:20px;">
      <div style="display:flex;align-items:flex-start;gap:12px;">
        <div style="font-size:26px;line-height:1;flex-shrink:0;">${d.flag || "🎓"}</div>
        <div>
          <div style="font-size:15px;font-weight:800;color:#1e1b4b;">${d.program_name}</div>
          <div style="font-size:12px;color:#6b7280;margin-top:3px;line-height:1.6;">
            ${d.university_name}${d.qs_ranking ? ` · QS #${d.qs_ranking}` : ""}  ·  ${d.city || d.country}, ${d.country}<br/>
            ${d.degree_level}  ·  ${(d.duration_months / 12).toFixed(1)} years
            ${d.scholarship_usd > 0 ? ` · ${fmtK(d.scholarship_usd)} scholarship` : ""}
            ·  Budget: ${d.budget_usd >= 999999 ? "No limit" : fmtK(d.budget_usd) + "/yr"}
          </div>
        </div>
      </div>
    </div>

    <!-- Recommendation badge -->
    <div style="background:${rcc.bg};border:1.5px solid ${rcc.border};border-radius:12px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;justify-content:space-between;gap:12px;">
      <div>
        <div style="font-size:10px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;margin-bottom:3px;">Recommendation</div>
        <div style="font-size:22px;font-weight:900;color:${rcc.text};">${d.recommendation_icon} ${d.recommendation}</div>
      </div>
      <div style="width:60px;height:60px;border-radius:50%;background:${rcc.badge};display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0;">
        <div style="font-size:20px;font-weight:900;color:#fff;line-height:1;">${d.total_pct}</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.8);font-weight:600;">/100</div>
      </div>
    </div>

    <!-- Score breakdown -->
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:#7c3aed;margin-bottom:8px;padding-bottom:5px;border-bottom:1.5px solid #ede9fe;">Score Breakdown</div>
      <table style="width:100%;border-collapse:collapse;">
        ${scores.map(scoreRow).join("")}
      </table>
    </div>

    <!-- Financial summary -->
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:#6366f1;margin-bottom:8px;padding-bottom:5px;border-bottom:1.5px solid #e0e7ff;">Financial Summary</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 8px;font-size:12px;color:#6b7280;">Total Cost (tuition + living)</td><td style="padding:9px 8px;text-align:right;font-weight:700;color:#1e1b4b;">${fmtK(d.total_cost_usd)}</td></tr>
        ${d.scholarship_usd > 0 ? `<tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 8px;font-size:12px;color:#6b7280;">Net Cost (after scholarship)</td><td style="padding:9px 8px;text-align:right;font-weight:700;color:#059669;">${fmtK(d.net_cost_usd)}</td></tr>` : ""}
        <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 8px;font-size:12px;color:#6b7280;">Expected Starting Salary</td><td style="padding:9px 8px;text-align:right;font-weight:700;color:#4f46e5;">${fmtK(d.expected_salary_usd)}/yr</td></tr>
        <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:9px 8px;font-size:12px;color:#6b7280;">Payback Period</td><td style="padding:9px 8px;text-align:right;font-weight:700;color:${paybackClass};">${fmtYrs(d.payback_years)}</td></tr>
        <tr><td style="padding:9px 8px;font-size:12px;color:#6b7280;">ROI Positive?</td><td style="padding:9px 8px;text-align:right;font-weight:700;color:${d.roi_positive ? "#059669" : "#dc2626"};">${d.roi_positive ? "Yes ✓" : "No ✗"}</td></tr>
      </table>
    </div>

    <!-- Qualitative -->
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.7px;color:#6366f1;margin-bottom:8px;padding-bottom:5px;border-bottom:1.5px solid #e0e7ff;">Destination & Career</div>
      <table style="width:100%;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:9px 8px;font-size:12px;color:#6b7280;width:130px;">Post-Study Work</td>
          <td style="padding:9px 8px;font-size:12px;font-weight:600;color:${d.psw_available ? "#059669" : "#dc2626"};">
            ${d.psw_available ? `✓ Available — ${d.psw_duration}` : "✗ Not available"}
            <div style="font-size:10px;color:#9ca3af;margin-top:1px;">${d.psw_note || ""}</div>
          </td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:9px 8px;font-size:12px;color:#6b7280;">Job Market</td>
          <td style="padding:9px 8px;">${ratingBadge(d.job_market_rating)}<div style="font-size:10px;color:#9ca3af;margin-top:2px;">${d.job_market_detail}</div></td>
        </tr>
        <tr style="border-bottom:1px solid #f1f5f9;">
          <td style="padding:9px 8px;font-size:12px;color:#6b7280;">Safety</td>
          <td style="padding:9px 8px;">${ratingBadge(d.safety_rating)}<div style="font-size:10px;color:#9ca3af;margin-top:2px;">${d.safety_detail}</div></td>
        </tr>
        <tr>
          <td style="padding:9px 8px;font-size:12px;color:#6b7280;">Student Life</td>
          <td style="padding:9px 8px;">${ratingBadge(d.student_life_rating)}<div style="font-size:10px;color:#9ca3af;margin-top:2px;">${d.student_life_detail}</div></td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-top:16px;">
      <a href="https://www.eduvianai.com/get-started" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#6366f1);color:#fff;text-decoration:none;padding:13px 32px;border-radius:12px;font-weight:700;font-size:14px;">Get a Full University Shortlist for Your Child →</a>
    </div>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { type, email, data } = await req.json() as {
      type: "roi" | "parent";
      email: string;
      data: ROIData | ParentData;
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "results@eduvianai.com";

    if (!resendKey) {
      return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
    }

    let subject: string;
    let htmlBody: string;

    if (type === "roi") {
      const d = data as ROIData;
      subject = `📊 Your ROI Analysis — ${d.program_name} at ${d.university_name}`;
      htmlBody = emailShell(`Your ROI results for ${d.program_name} at ${d.university_name}`, buildROIEmail(d));
    } else if (type === "parent") {
      const d = data as ParentData;
      subject = `👨‍👩‍👧 Parent Decision Report — ${d.program_name} at ${d.university_name}`;
      htmlBody = emailShell(`Parent decision verdict for ${d.program_name} at ${d.university_name}`, buildParentEmail(d));
    } else {
      return NextResponse.json({ error: "Invalid type." }, { status: 400 });
    }

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `eduvianAI <${fromEmail}>`,
        to: [email],
        subject,
        html: htmlBody,
      }),
    });

    if (!sendRes.ok) {
      const errData = await sendRes.json();
      console.error("Resend error:", errData);
      throw new Error(errData.message ?? "Email send failed");
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    return apiErrorResponse(err, { route: "email/tools" }, "Failed to send email. Please try again.");
  }
}
