import { NextRequest, NextResponse } from "next/server";
import { captureApiError } from "@/lib/api-error";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Rate limit: 3 welcome emails per IP per hour (prevents email abuse)
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`email-welcome:${ip}`, 3, 3600);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Rate limited" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { name, email } = body as { name: string; email: string };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.warn("RESEND_API_KEY not set — skipping welcome email");
      return NextResponse.json({ ok: true, skipped: true });
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@eduvianai.com";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.eduvianai.com";

    // Sanitize — strip HTML chars before interpolating into the email template
    const rawFirst = (name ?? "").split(" ")[0].trim().slice(0, 60) || "there";
    const firstName = rawFirst.replace(/[<>"'&`]/g, "");

    const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to eduvianAI</title>
</head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4FF;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(99,102,241,0.10);">

          <!-- ── HERO BANNER ────────────────────────────────────── -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#4c1d95 100%);padding:40px 40px 36px;text-align:center;">
              <!-- Logo mark -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
                <tr>
                  <td align="center" style="line-height:0;">
                    <img src="${appUrl}/logo.svg" width="56" height="56" alt="eduvianAI" style="display:block;width:56px;height:56px;border:0;outline:none;" />
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;font-size:13px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#a5b4fc;">eduvianAI</p>
              <h1 style="margin:0 0 16px;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">
                Congratulations, ${firstName}! 🎉
              </h1>
              <p style="margin:0;font-size:16px;color:#c7d2fe;line-height:1.6;max-width:420px;margin-left:auto;margin-right:auto;">
                You've just taken the most important step towards your global education dream. That takes courage — and we're here to make every step that follows easier, smarter, and more certain.
              </p>
            </td>
          </tr>

          <!-- ── WHAT IS EDUVIANAI ──────────────────────────────── -->
          <tr>
            <td style="padding:40px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FF;border-radius:16px;padding:28px 28px;">
                <tr>
                  <td>
                    <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6366F1;">About eduvianAI</p>
                    <h2 style="margin:0 0 14px;font-size:20px;font-weight:800;color:#1e1b4b;line-height:1.3;">Your intelligent partner for study abroad</h2>
                    <p style="margin:0;font-size:15px;color:#4b5563;line-height:1.7;">
                      eduvianAI brings together <strong>live data across hundreds of universities and thousands of programs</strong>, advanced AI, and the end-to-end workflow of a full application journey — all in one place. From shortlisting and SOP writing to interview practice, English-test prep, and ROI analysis, every decision you make is backed by <strong>evidence, not opinion</strong> — personalised to your academic profile, budget, and ambitions.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── HOW WE CAN HELP ────────────────────────────────── -->
          <tr>
            <td style="padding:36px 40px 0;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6366F1;">Your toolkit</p>
              <h2 style="margin:0 0 24px;font-size:20px;font-weight:800;color:#1e1b4b;">Everything you need, in one place</h2>

              <!-- Tool 1 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="52" valign="top" style="padding-right:16px;">
                    <div style="width:44px;height:44px;background:linear-gradient(135deg,#EEF2FF,#E0E7FF);border-radius:12px;text-align:center;line-height:44px;font-size:22px;">🎯</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1e1b4b;">University Matching</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Get a personalised shortlist of programs across USA, UK, Australia, Canada &amp; Europe in under 90 seconds — matched to your academic profile, budget, and goals.</p>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <div style="height:1px;background:#f3f4f6;margin:4px 0 16px;"></div>

              <!-- Tool 2 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="52" valign="top" style="padding-right:16px;">
                    <div style="width:44px;height:44px;background:linear-gradient(135deg,#F5F3FF,#EDE9FE);border-radius:12px;text-align:center;line-height:44px;font-size:22px;">✍️</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1e1b4b;">SOP Assistant</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Write a Statement of Purpose that's uniquely yours — free of clichés, powered by AI, and tailored to each university you apply to.</p>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:#f3f4f6;margin:4px 0 16px;"></div>

              <!-- Tool 3 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="52" valign="top" style="padding-right:16px;">
                    <div style="width:44px;height:44px;background:linear-gradient(135deg,#ECFDF5,#D1FAE5);border-radius:12px;text-align:center;line-height:44px;font-size:22px;">📋</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1e1b4b;">Application Strength Check</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Score your full application, uncover risk flags, and get a prioritised fix list — so you never submit a weak application again.</p>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:#f3f4f6;margin:4px 0 16px;"></div>

              <!-- Tool 4 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="52" valign="top" style="padding-right:16px;">
                    <div style="width:44px;height:44px;background:linear-gradient(135deg,#FFF7ED,#FED7AA);border-radius:12px;text-align:center;line-height:44px;font-size:22px;">🎤</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1e1b4b;">Interview Prep Coach</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Practice real visa and university interview questions with an AI voice coach. Get instant feedback on structure, clarity, and confidence — for AU, UK, and USA.</p>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:#f3f4f6;margin:4px 0 16px;"></div>

              <!-- Tool 5 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="52" valign="top" style="padding-right:16px;">
                    <div style="width:44px;height:44px;background:linear-gradient(135deg,#F0FDFA,#CCFBF1);border-radius:12px;text-align:center;line-height:44px;font-size:22px;">🧪</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1e1b4b;">English Test Lab</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Full-length mock tests for IELTS, PTE, TOEFL, and Duolingo English Test — with AI scoring and personalised improvement tips.</p>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:#f3f4f6;margin:4px 0 16px;"></div>

              <!-- Tool 6 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td width="52" valign="top" style="padding-right:16px;">
                    <div style="width:44px;height:44px;background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border-radius:12px;text-align:center;line-height:44px;font-size:22px;">📊</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1e1b4b;">ROI Calculator</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Compare universities by financial return — payback period, 10-year income projection, and cost-benefit breakdown — so you choose with clarity, not just hope.</p>
                  </td>
                </tr>
              </table>

              <div style="height:1px;background:#f3f4f6;margin:4px 0 16px;"></div>

              <!-- Tool 7 -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:4px;">
                <tr>
                  <td width="52" valign="top" style="padding-right:16px;">
                    <div style="width:44px;height:44px;background:linear-gradient(135deg,#FFF1F2,#FFE4E6);border-radius:12px;text-align:center;line-height:44px;font-size:22px;">👨‍👩‍👧</div>
                  </td>
                  <td valign="top">
                    <p style="margin:0 0 3px;font-size:15px;font-weight:700;color:#1e1b4b;">Parent Decision Tool</p>
                    <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.5;">Share a clear, data-driven report with your family — covering costs, returns, visa reality, and safety — so everyone makes the decision together, confidently.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── PROMISE BLOCK ──────────────────────────────────── -->
          <tr>
            <td style="padding:36px 40px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1e1b4b,#312e81);border-radius:16px;padding:28px;">
                <tr>
                  <td>
                    <p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a5b4fc;">Our promise to you</p>
                    <p style="margin:0;font-size:15px;color:#e0e7ff;line-height:1.7;">
                      You get the <strong style="color:#ffffff;">full picture</strong> — match scores, cost reality, acceptance odds, and career ROI — powered by the <strong style="color:#ffffff;">most comprehensive program database and AI toolkit</strong> built for international students. No noise, no fluff, just clarity. Your dream, your decision, our data.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── CTA ───────────────────────────────────────────── -->
          <tr>
            <td style="padding:36px 40px;text-align:center;">
              <p style="margin:0 0 20px;font-size:16px;color:#374151;line-height:1.6;">
                Your profile is ready. It takes just 2 minutes to get your personalised university shortlist.
              </p>
              <a href="${appUrl}/get-started" style="display:inline-block;background:linear-gradient(135deg,#6366F1,#8B5CF6);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 36px;border-radius:12px;letter-spacing:0.3px;">
                Find My Programs →
              </a>
              <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;">
                Or explore individual tools at
                <a href="${appUrl}" style="color:#6366F1;text-decoration:none;font-weight:600;">eduvianai.com</a>
              </p>
            </td>
          </tr>

          <!-- ── FOOTER ─────────────────────────────────────────── -->
          <tr>
            <td style="background:#F8F9FF;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#6366F1;">eduvianAI</p>
              <p style="margin:0 0 10px;font-size:12px;color:#9ca3af;">Study abroad, made intelligent.</p>
              <p style="margin:0;font-size:11px;color:#d1d5db;">
                You're receiving this because you registered at eduvianai.com.<br/>
                If this wasn't you, please ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `eduvianAI <${fromEmail}>`,
        reply_to: "support@eduvianai.com",
        to: [email],
        subject: `Welcome to eduvianAI, ${firstName}! 🌍 Your study abroad journey starts here`,
        html: htmlBody,
      }),
    });

    if (!sendRes.ok) {
      const errData = await sendRes.json();
      console.error("Resend welcome email error:", errData);
      throw new Error(errData.message ?? "Welcome email send failed");
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    captureApiError(err, { route: "email/welcome" });
    // Non-fatal — don't block registration
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
