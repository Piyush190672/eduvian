import { NextRequest, NextResponse } from "next/server";
import { apiErrorResponse } from "@/lib/api-error";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { generateOtpCode, hashOtpCode, OTP_CONFIG } from "@/lib/otp";
import { createServiceClient } from "@/lib/supabase";
import { escHtmlBounded } from "@/lib/html-escape";

// Reads request data — must run per-request, never statically.
export const dynamic = "force-dynamic";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 255;
}

function isValidPurpose(p: unknown): p is "register" | "login" {
  return p === "register" || p === "login";
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);

    // Burst guard: 10 send-otp requests per IP per hour. Independent of the
    // per-email cooldown enforced below; this catches scripted abuse against
    // many emails from one source.
    const ipRl = await checkRateLimit(
      `send-otp-ip:${ip}`,
      OTP_CONFIG.ipSendLimit,
      OTP_CONFIG.ipSendWindowSeconds,
    );
    if (!ipRl.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(ipRl.retryAfter ?? 60) } },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      email?: unknown;
      purpose?: unknown;
      name?: unknown;
    };

    const email = typeof body.email === "string" ? body.email : "";
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!isValidPurpose(body.purpose)) {
      return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
    }
    const purpose = body.purpose;
    const normalizedEmail = email.toLowerCase().trim();
    const firstName = escHtmlBounded(
      typeof body.name === "string" ? body.name.split(" ")[0] : "",
      60,
      "there",
    );

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    // Per-email cooldown — block resends within the configured window. We
    // look at the most recent challenge for this email regardless of purpose
    // so a register-then-login sequence still cools down.
    const { data: recent, error: recentErr } = await supabase
      .from("otp_challenges")
      .select("created_at")
      .eq("email", normalizedEmail)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recentErr) {
      console.error("send-otp: recent lookup failed", recentErr);
    }
    if (recent?.created_at) {
      const elapsed = (Date.now() - new Date(recent.created_at as string).getTime()) / 1000;
      if (elapsed < OTP_CONFIG.resendCooldownSeconds) {
        const wait = Math.ceil(OTP_CONFIG.resendCooldownSeconds - elapsed);
        return NextResponse.json(
          { error: `Please wait ${wait}s before requesting another code.` },
          { status: 429, headers: { "Retry-After": String(wait) } },
        );
      }
    }

    // Existing-account hint — useful for register vs login UX, but we
    // intentionally don't reveal it on the send-otp response (avoid email
    // enumeration). Just for our own server-side decision branches if we
    // ever want to short-circuit.

    const code = generateOtpCode();
    const codeHash = hashOtpCode(code, normalizedEmail);
    const expiresAt = new Date(Date.now() + OTP_CONFIG.expirySeconds * 1000).toISOString();

    const { error: insErr } = await supabase.from("otp_challenges").insert({
      email: normalizedEmail,
      code_hash: codeHash,
      purpose,
      expires_at: expiresAt,
      ip,
      user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
    });
    if (insErr) {
      console.error("send-otp: insert failed", insErr);
      return NextResponse.json({ error: "Could not generate code" }, { status: 500 });
    }

    // Send the email. Failure to send shouldn't expose the code, but should
    // surface a 500 so the client can retry — we don't want a "success"
    // response with no email actually sent.
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("send-otp: RESEND_API_KEY not configured");
      return NextResponse.json({ error: "Email service not configured" }, { status: 503 });
    }
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? "results@eduvianai.com";
    const action = purpose === "register" ? "complete your registration" : "sign in";
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>Your eduvianAI verification code</title></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
    <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:28px 32px;text-align:center;color:#fff;">
      <div style="font-size:22px;font-weight:900;letter-spacing:-0.3px;">eduvianAI</div>
      <div style="margin-top:4px;font-size:13px;color:#e0e7ff;">Your Global Future, Simplified</div>
    </div>
    <div style="padding:32px;color:#1e1b4b;">
      <h2 style="margin:0 0 12px;font-size:18px;">Hey ${firstName},</h2>
      <p style="margin:0 0 16px;line-height:1.6;color:#374151;font-size:14px;">
        Use the verification code below to ${action}. The code expires in ${Math.round(OTP_CONFIG.expirySeconds / 60)} minutes.
      </p>
      <div style="background:#f0f4ff;border:1.5px solid #c7d2fe;border-radius:12px;padding:18px 20px;text-align:center;margin:16px 0 24px;">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;color:#6366f1;text-transform:uppercase;margin-bottom:6px;">Verification Code</div>
        <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#1e1b4b;font-family:'Courier New',monospace;">${code}</div>
      </div>
      <p style="margin:0 0 8px;font-size:12px;color:#6b7280;line-height:1.6;">
        If you didn't request this, you can safely ignore the email — your account stays untouched.
      </p>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
        Never share this code with anyone. eduvianAI staff will never ask for it.
      </p>
    </div>
    <div style="padding:16px 32px;text-align:center;background:#f8fafc;border-top:1px solid #f1f5f9;color:#9ca3af;font-size:11px;">
      © 2026 eduvianAI · <a href="https://www.eduvianai.com" style="color:#6366f1;text-decoration:none;">eduvianai.com</a>
    </div>
  </div>
</body></html>`;

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `eduvianAI <${fromEmail}>`,
        reply_to: "support@eduvianai.com",
        to: [normalizedEmail],
        subject: `Your eduvianAI verification code: ${code}`,
        html,
      }),
    });

    if (!sendRes.ok) {
      const errData = await sendRes.json().catch(() => ({}));
      console.error("send-otp: Resend error", errData);
      return NextResponse.json({ error: "Could not send the code. Please retry." }, { status: 502 });
    }

    return NextResponse.json({
      ok: true,
      expiresInSeconds: OTP_CONFIG.expirySeconds,
    });
  } catch (err) {
    return apiErrorResponse(err, { route: "auth/send-otp" }, "Could not send verification code");
  }
}
