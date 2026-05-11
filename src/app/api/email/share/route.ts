import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { escHtml } from "@/lib/html-escape";
import { getClientIp, aiToolLimit } from "@/lib/rate-limit";

export const maxDuration = 15;

/**
 * /api/email/share — backend-mediated send for the <ShareWithFamily /> component.
 * Replaces the earlier `mailto:` link so the user doesn't have to bounce through
 * their local email client. The component still passes the same subject + body
 * (text-form) so the caller decides what's in the message; this endpoint just
 * wraps it in a minimal HTML shell and forwards via Resend.
 *
 * Rate-limited via the same aiToolLimit bucket as other share endpoints — this
 * is user-triggered, low volume, but worth guarding against abuse.
 */
export async function POST(req: NextRequest) {
  try {
    const limited = await aiToolLimit(req, "email-share", null, { limit: 10 });
    if (limited) return limited;

    const body = await req.json() as { to?: string; subject?: string; text?: string; sourceUrl?: string };
    const { to, subject, text, sourceUrl } = body;

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }
    if (!subject || !text) {
      return NextResponse.json({ error: "Subject and message body are required." }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "results@eduvianai.com";
    if (!resendKey) {
      return NextResponse.json({ error: "Email service not configured." }, { status: 503 });
    }

    // CRLF strip for header fields (defence-in-depth against injection).
    const stripCR = (s: string) => s.replace(/[\r\n]/g, "").slice(0, 250);
    const safeSubject = stripCR(subject);

    // Convert text body to a simple HTML shell. Preserve paragraphs; escape
    // everything else. Links are auto-linked only on lines that are URLs.
    const escapedText = escHtml(text);
    const htmlLines = escapedText.split("\n").map((ln) => {
      const trimmed = ln.trim();
      if (!trimmed) return "<div style=\"height:8px\"></div>";
      // Auto-link http(s) URLs only on lines that are URL-ish (keep safe escape on the rest)
      const linkified = trimmed.replace(
        /(https?:\/\/[^\s<>"]+)/g,
        '<a href="$1" style="color:#7c3aed;text-decoration:underline;word-break:break-all;">$1</a>'
      );
      return `<p style="margin:0 0 12px 0;line-height:1.55;">${linkified}</p>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escHtml(safeSubject)}</title></head>
<body style="margin:0;padding:0;background:#f7f7f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f8;padding:24px 0;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px;box-shadow:0 4px 16px rgba(15,23,42,0.06);" cellpadding="0" cellspacing="0">
      <tr><td>
        <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7c3aed;font-weight:700;margin-bottom:6px;">Shared from EduvianAI</div>
        <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:18px;">${escHtml(safeSubject)}</div>
        ${htmlLines}
        ${sourceUrl ? `<div style="margin-top:24px;padding-top:18px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">View on EduvianAI: <a href="${escHtml(sourceUrl)}" style="color:#7c3aed;">${escHtml(sourceUrl)}</a></div>` : ""}
        <div style="margin-top:20px;font-size:11px;color:#9ca3af;line-height:1.5;">This message was sent because someone on EduvianAI chose to share this page. Reply to this email to reach the sender; EduvianAI does not see your reply.</div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `EduvianAI <${fromEmail}>`,
        to: [to],
        subject: safeSubject,
        html,
        text,
      }),
    });

    if (!res.ok) {
      const errData = await res.text().catch(() => "");
      console.error("/api/email/share Resend error:", res.status, errData.slice(0, 200));
      return NextResponse.json({ error: "Failed to send email." }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiErrorResponse(err, { route: "/api/email/share", extra: { ip: getClientIp(req.headers) } });
  }
}
