import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { escHtml } from "@/lib/html-escape";

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

function pct(score: number, max: number): number {
  return Math.round((score / max) * 100);
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

// ── Shared page shell ─────────────────────────────────────────────────────────

function pageShell(title: string, body: string): string {
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — eduvianAI</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; background: #f8fafc; color: #1e293b; font-size: 13px; line-height: 1.5; }
    .page { max-width: 780px; margin: 0 auto; background: #fff; min-height: 100vh; }
    /* Header */
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899); padding: 28px 36px; display: flex; align-items: center; justify-content: space-between; }
    .brand { font-size: 22px; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
    .brand-sub { font-size: 11px; color: #e0e7ff; font-weight: 600; margin-top: 1px; }
    .report-meta { text-align: right; }
    .report-title { font-size: 14px; font-weight: 700; color: #fff; }
    .report-date { font-size: 11px; color: #c7d2fe; margin-top: 2px; }
    /* Body */
    .body { padding: 28px 36px 36px; }
    /* Sections */
    .section { margin-bottom: 22px; }
    .section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #6366f1; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1.5px solid #e0e7ff; }
    /* Program info box */
    .program-box { background: #f0f4ff; border: 1.5px solid #c7d2fe; border-radius: 12px; padding: 14px 18px; display: flex; align-items: flex-start; gap: 14px; }
    .program-flag { font-size: 28px; line-height: 1; flex-shrink: 0; }
    .program-name { font-size: 16px; font-weight: 800; color: #1e1b4b; line-height: 1.2; }
    .program-meta { font-size: 11px; color: #6b7280; margin-top: 4px; line-height: 1.6; }
    /* Metric grid */
    .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .metric-card { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; text-align: center; }
    .metric-label { font-size: 10px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .metric-value { font-size: 18px; font-weight: 900; color: #1e1b4b; line-height: 1; }
    .metric-sub { font-size: 10px; color: #94a3b8; margin-top: 3px; }
    /* Two-col grid */
    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    /* Table */
    table { width: 100%; border-collapse: collapse; }
    th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; background: #f8fafc; border-bottom: 1.5px solid #e2e8f0; }
    td { padding: 9px 10px; font-size: 12px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    td.label { color: #6b7280; font-weight: 500; width: 52%; }
    td.value { font-weight: 700; color: #1e1b4b; text-align: right; }
    td.value.green { color: #059669; }
    td.value.red { color: #dc2626; }
    td.value.blue { color: #4f46e5; }
    /* Score bar */
    .score-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; border-bottom: 1px solid #f1f5f9; }
    .score-row:last-child { border-bottom: none; }
    .score-row-label { font-size: 11px; color: #374151; font-weight: 500; width: 130px; flex-shrink: 0; }
    .score-bar-track { flex: 1; height: 6px; background: #e5e7eb; border-radius: 999px; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 999px; }
    .score-row-pts { font-size: 11px; font-weight: 800; color: #1e1b4b; width: 42px; text-align: right; flex-shrink: 0; }
    /* Recommendation badge */
    .rec-badge { border-radius: 12px; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
    .rec-badge.emerald { background: #f0fdf4; border: 1.5px solid #bbf7d0; }
    .rec-badge.amber   { background: #fffbeb; border: 1.5px solid #fde68a; }
    .rec-badge.rose    { background: #fff1f2; border: 1.5px solid #fecdd3; }
    .rec-label { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 3px; }
    .rec-title.emerald { font-size: 20px; font-weight: 900; color: #065f46; }
    .rec-title.amber   { font-size: 20px; font-weight: 900; color: #92400e; }
    .rec-title.rose    { font-size: 20px; font-weight: 900; color: #be123c; }
    .score-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
    .score-circle.emerald { background: #059669; }
    .score-circle.amber   { background: #d97706; }
    .score-circle.rose    { background: #e11d48; }
    .score-circle-num { font-size: 22px; font-weight: 900; color: #fff; line-height: 1; }
    .score-circle-denom { font-size: 10px; color: rgba(255,255,255,0.8); font-weight: 600; }
    /* Insight box */
    .insight { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 12px 14px; }
    .insight-label { font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 5px; }
    .insight-text { font-size: 12px; color: #374151; line-height: 1.55; }
    /* Qual row */
    .qual-row { display: flex; align-items: flex-start; gap: 10px; padding: 7px 0; border-bottom: 1px solid #f1f5f9; }
    .qual-row:last-child { border-bottom: none; }
    .qual-label { font-size: 11px; color: #6b7280; font-weight: 500; width: 130px; flex-shrink: 0; }
    .qual-value { font-size: 12px; font-weight: 700; color: #1e1b4b; flex: 1; }
    .qual-detail { font-size: 10px; color: #9ca3af; margin-top: 2px; }
    .rating-badge { display: inline-block; padding: 2px 9px; border-radius: 999px; font-size: 10px; font-weight: 700; }
    .rating-badge.Excellent { background: #d1fae5; color: #065f46; }
    .rating-badge.Good      { background: #fef3c7; color: #92400e; }
    .rating-badge.Concerning{ background: #fee2e2; color: #991b1b; }
    /* Footer */
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 36px; display: flex; align-items: center; justify-content: space-between; }
    .footer-brand { font-size: 11px; font-weight: 700; color: #6366f1; }
    .footer-note { font-size: 10px; color: #94a3b8; }
    /* Payback indicator */
    .payback-good  { color: #059669; }
    .payback-ok    { color: #d97706; }
    .payback-long  { color: #dc2626; }
    .roi-pos { color: #059669; }
    .roi-neg { color: #dc2626; }
    /* Print */
    @media print {
      body { background: #fff; }
      .page { box-shadow: none; }
      @page { margin: 0.5cm; size: A4; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="brand">🌍 eduvianAI</div>
        <div class="brand-sub">Your Global Future, Simplified</div>
      </div>
      <div class="report-meta">
        <div class="report-title">${title}</div>
        <div class="report-date">Generated ${date}</div>
      </div>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <div class="footer-brand">eduvianAI · www.eduvianai.com</div>
      <div class="footer-note">Salary figures are median graduate outcomes. All amounts in USD. For informational purposes only.</div>
    </div>
  </div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 400));</script>
</body>
</html>`;
}

// ── ROI HTML body ─────────────────────────────────────────────────────────────

function buildROIBody(d: ROIData): string {
  const durationYears = (d.duration_months / 12).toFixed(1);
  const paybackClass = d.payback_years <= 8 ? "payback-good" : d.payback_years <= 15 ? "payback-ok" : "payback-long";
  const roiClass = d.ten_year_roi_pct >= 0 ? "roi-pos" : "roi-neg";
  const gainClass = d.net_earnings_10yr_usd >= 0 ? "roi-pos" : "roi-neg";
  const breakevenOk = d.expected_salary_usd >= d.breakeven_salary_usd;

  const scoreBarColor = (p: number) => p >= 75 ? "#10b981" : p >= 50 ? "#f59e0b" : "#f43f5e";

  return `
    <!-- Program info -->
    <div class="section">
      <div class="section-title">Program Overview</div>
      <div class="program-box">
        <div class="program-flag">${escHtml(d.flag || "🎓")}</div>
        <div>
          <div class="program-name">${escHtml(d.program_name)}</div>
          <div class="program-meta">
            ${escHtml(d.university_name)}${d.qs_ranking ? ` · QS Rank #${escHtml(d.qs_ranking)}` : ""}  ·  ${escHtml(d.city || d.country)}, ${escHtml(d.country)}<br/>
            ${escHtml(d.degree_level)}  ·  ${escHtml(d.field)}  ·  ${d.duration_months} months (${durationYears} years)
            ${d.scholarship_usd > 0 ? `  ·  ${escHtml(fmtK(d.scholarship_usd))} scholarship` : ""}
          </div>
        </div>
      </div>
    </div>

    <!-- Key metrics -->
    <div class="section">
      <div class="section-title">Key Financial Metrics</div>
      <div class="metric-grid">
        <div class="metric-card">
          <div class="metric-label">Total Investment</div>
          <div class="metric-value">${fmtK(d.total_investment_usd)}</div>
          <div class="metric-sub">Net of scholarship</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Payback Period</div>
          <div class="metric-value ${paybackClass}">${fmtYrs(d.payback_years)}</div>
          <div class="metric-sub">At ${d.savings_rate_pct}% savings rate</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">10-Year ROI</div>
          <div class="metric-value ${roiClass}">${d.ten_year_roi_pct > 0 ? "+" : ""}${Math.round(d.ten_year_roi_pct)}%</div>
          <div class="metric-sub">Return on investment</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">10-yr Net Gain</div>
          <div class="metric-value ${gainClass}">${d.net_earnings_10yr_usd >= 0 ? "+" : ""}${fmtK(d.net_earnings_10yr_usd)}</div>
          <div class="metric-sub">Earnings − investment</div>
        </div>
      </div>
    </div>

    <!-- Cost breakdown + financial summary -->
    <div class="section">
      <div class="two-col">
        <div>
          <div class="section-title">Cost Breakdown</div>
          <table>
            <thead><tr><th>Item</th><th style="text-align:right">Amount</th></tr></thead>
            <tbody>
              <tr><td class="label">Annual Tuition</td><td class="value blue">${fmtUSD(d.annual_tuition_usd)}</td></tr>
              <tr><td class="label">Annual Living Costs</td><td class="value blue">${fmtUSD(d.avg_living_cost_usd)}</td></tr>
              <tr><td class="label">Duration</td><td class="value">${durationYears} years</td></tr>
              <tr><td class="label">Total Tuition</td><td class="value">${fmtUSD(d.total_tuition_usd)}</td></tr>
              <tr><td class="label">Total Living</td><td class="value">${fmtUSD(d.total_living_usd)}</td></tr>
              ${d.scholarship_usd > 0 ? `<tr><td class="label">Scholarship</td><td class="value green">−${fmtUSD(d.scholarship_usd)}</td></tr>` : ""}
              <tr><td class="label" style="font-weight:700;color:#1e1b4b;">Net Investment</td><td class="value">${fmtUSD(d.total_investment_usd)}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div class="section-title">After Graduation</div>
          <table>
            <thead><tr><th>Metric</th><th style="text-align:right">Value</th></tr></thead>
            <tbody>
              <tr><td class="label">Expected Salary / yr</td><td class="value blue">${fmtUSD(d.expected_salary_usd)}</td></tr>
              <tr><td class="label">Savings Rate</td><td class="value">${d.savings_rate_pct}%</td></tr>
              <tr><td class="label">Monthly Savings</td><td class="value green">${fmtK(d.monthly_savings_usd)}</td></tr>
              <tr><td class="label">Monthly Budget (study)</td><td class="value">${fmtK(d.monthly_budget_usd)}</td></tr>
              <tr><td class="label">Payback Period</td><td class="value ${paybackClass}">${fmtYrs(d.payback_years)}</td></tr>
              <tr><td class="label">10-Year ROI</td><td class="value ${roiClass}">${d.ten_year_roi_pct > 0 ? "+" : ""}${Math.round(d.ten_year_roi_pct)}%</td></tr>
              <tr><td class="label">10-yr Net Earnings</td><td class="value ${gainClass}">${fmtK(d.net_earnings_10yr_usd)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Break-even insight -->
    <div class="section">
      <div class="section-title">Break-even Analysis</div>
      <div class="insight">
        <div class="insight-label">Break-even Salary Needed (5-year recovery at ${d.savings_rate_pct}% savings)</div>
        <div class="insight-text">
          Minimum salary required: <strong>${fmtUSD(d.breakeven_salary_usd)}/yr</strong><br/>
          Your expected salary: <strong>${fmtUSD(d.expected_salary_usd)}/yr</strong><br/>
          ${breakevenOk
            ? `<span style="color:#059669;font-weight:700;">✓ Your salary exceeds the break-even threshold — this degree pays off within 5 years at your savings rate.</span>`
            : `<span style="color:#d97706;font-weight:700;">⚠ Salary gap of ${fmtUSD(d.breakeven_salary_usd - d.expected_salary_usd)}/yr — consider scholarships or a higher-earning specialisation to improve the return.</span>`
          }
        </div>
      </div>
    </div>`;
}

// ── Parent HTML body ──────────────────────────────────────────────────────────

function buildParentBody(d: ParentData): string {
  const durationYears = (d.duration_months / 12).toFixed(1);
  const rc = d.recommendation_color as "emerald" | "amber" | "rose";
  const scoreBarColor = (p: number) => p >= 75 ? "#10b981" : p >= 50 ? "#f59e0b" : "#f43f5e";

  const scores = [
    { label: "Budget Fit",      score: d.budget_fit_score,    max: 20 },
    { label: "QS Ranking",      score: d.ranking_score,       max: 15 },
    { label: "Post-Study Work", score: d.psw_score,           max: 15 },
    { label: "Job Market",      score: d.job_market_score,    max: 15 },
    { label: "Financial ROI",   score: d.financial_roi_score, max: 15 },
    { label: "Safety",          score: d.safety_score,        max: 10 },
    { label: "Student Life",    score: d.student_life_score,  max: 10 },
  ];

  const paybackClass = d.payback_years <= 8 ? "roi-pos" : d.payback_years <= 15 ? "payback-ok" : "roi-neg";

  return `
    <!-- Program info -->
    <div class="section">
      <div class="section-title">Program Overview</div>
      <div class="program-box">
        <div class="program-flag">${escHtml(d.flag || "🎓")}</div>
        <div>
          <div class="program-name">${escHtml(d.program_name)}</div>
          <div class="program-meta">
            ${escHtml(d.university_name)}${d.qs_ranking ? ` · QS Rank #${escHtml(d.qs_ranking)}` : ""}  ·  ${escHtml(d.city || d.country)}, ${escHtml(d.country)}<br/>
            ${escHtml(d.degree_level)}  ·  ${escHtml(d.field)}  ·  ${d.duration_months} months (${durationYears} years)
            ${d.scholarship_usd > 0 ? `  ·  ${escHtml(fmtK(d.scholarship_usd))} scholarship` : ""}
            ·  Parent budget: ${d.budget_usd >= 999999 ? "No limit" : escHtml(fmtK(d.budget_usd)) + "/yr"}
          </div>
        </div>
      </div>
    </div>

    <!-- Recommendation -->
    <div class="section">
      <div class="section-title">Verdict</div>
      <div class="rec-badge ${rc}">
        <div>
          <div class="rec-label">Overall Recommendation</div>
          <div class="rec-title ${rc}">${escHtml(d.recommendation_icon)} ${escHtml(d.recommendation)}</div>
          <div style="font-size:11px;color:#6b7280;margin-top:4px;">${escHtml(d.university_name)} · ${escHtml(d.program_name)}</div>
        </div>
        <div class="score-circle ${rc}">
          <div class="score-circle-num">${d.total_pct}</div>
          <div class="score-circle-denom">/ 100</div>
        </div>
      </div>

      <!-- Score breakdown -->
      <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:14px 16px;">
        ${scores.map(({ label, score, max }) => {
          const p = pct(score, max);
          const color = scoreBarColor(p);
          return `
          <div class="score-row">
            <div class="score-row-label">${label}</div>
            <div class="score-bar-track"><div class="score-bar-fill" style="width:${p}%;background:${color};"></div></div>
            <div class="score-row-pts">${score}/${max}</div>
          </div>`;
        }).join("")}
      </div>
    </div>

    <!-- Financial summary -->
    <div class="section">
      <div class="section-title">Financial Summary</div>
      <div class="two-col">
        <table>
          <thead><tr><th>Cost</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            <tr><td class="label">Annual Tuition</td><td class="value blue">${fmtK(d.annual_tuition_usd)}</td></tr>
            <tr><td class="label">Annual Living</td><td class="value blue">${fmtK(d.avg_living_cost_usd)}</td></tr>
            <tr><td class="label">Total Tuition</td><td class="value">${fmtK(d.total_tuition_usd)}</td></tr>
            <tr><td class="label">Total Living</td><td class="value">${fmtK(d.total_living_usd)}</td></tr>
            ${d.scholarship_usd > 0 ? `<tr><td class="label">Scholarship</td><td class="value green">−${fmtK(d.scholarship_usd)}</td></tr>` : ""}
            <tr><td class="label" style="font-weight:700;color:#1e1b4b;">Net Cost</td><td class="value">${fmtK(d.net_cost_usd)}</td></tr>
          </tbody>
        </table>
        <table>
          <thead><tr><th>Returns</th><th style="text-align:right">Value</th></tr></thead>
          <tbody>
            <tr><td class="label">Expected Salary</td><td class="value blue">${fmtK(d.expected_salary_usd)}/yr</td></tr>
            <tr><td class="label">Payback Period</td><td class="value ${paybackClass}">${fmtYrs(d.payback_years)}</td></tr>
            <tr><td class="label">ROI Positive?</td><td class="value ${d.roi_positive ? "green" : "red"}">${d.roi_positive ? "Yes ✓" : "No ✗"}</td></tr>
            <tr><td class="label">Budget Fit</td><td class="value ${d.budget_fit_score >= 14 ? "green" : d.budget_fit_score >= 8 ? "" : "red"}">${d.budget_fit_score >= 16 ? "Within budget" : d.budget_fit_score >= 10 ? "Slightly over" : "Over budget"}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Qualitative assessment -->
    <div class="section">
      <div class="section-title">Destination & Career Assessment</div>
      <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:10px 14px;">
        <div class="qual-row">
          <div class="qual-label">Post-Study Work</div>
          <div class="qual-value">
            ${d.psw_available
              ? `<span style="color:#059669;">✓ Available — ${escHtml(d.psw_duration)}</span>`
              : `<span style="color:#dc2626;">✗ Not available</span>`}
            <div class="qual-detail">${escHtml(d.psw_note || "")}</div>
          </div>
        </div>
        <div class="qual-row">
          <div class="qual-label">Job Market</div>
          <div class="qual-value">
            <span class="rating-badge ${escHtml(d.job_market_rating)}">${escHtml(d.job_market_rating)}</span>
            <div class="qual-detail">${escHtml(d.job_market_detail)}</div>
          </div>
        </div>
        <div class="qual-row">
          <div class="qual-label">Safety & Security</div>
          <div class="qual-value">
            <span class="rating-badge ${escHtml(d.safety_rating)}">${escHtml(d.safety_rating)}</span>
            <div class="qual-detail">${escHtml(d.safety_detail)}</div>
          </div>
        </div>
        <div class="qual-row">
          <div class="qual-label">Student Life</div>
          <div class="qual-value">
            <span class="rating-badge ${escHtml(d.student_life_rating)}">${escHtml(d.student_life_rating)}</span>
            <div class="qual-detail">${escHtml(d.student_life_detail)}</div>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json() as { type: "roi" | "parent"; data: ROIData | ParentData };

    if (type === "roi") {
      const d = data as ROIData;
      const html = pageShell("ROI Analysis Report", buildROIBody(d));
      return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    if (type === "parent") {
      const d = data as ParentData;
      const html = pageShell("Parent Decision Report", buildParentBody(d));
      return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (err) {
    return apiErrorResponse(err, { route: "pdf/tools" }, "Failed to generate PDF");
  }
}
