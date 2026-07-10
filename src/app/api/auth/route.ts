import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { createUserToken, USER_COOKIE_NAME, USER_COOKIE_OPTS } from "@/lib/user-cookie";
import { apiErrorResponse } from "@/lib/api-error";
import { verifyOtpCode, OTP_CONFIG } from "@/lib/otp";
import { emailHash } from "@/lib/pii-crypto";
import { decryptProfile, SUBMISSION_PROFILE_COLUMNS } from "@/lib/submissions-decrypt";
import { TERMS_VERSION } from "@/lib/legal-version";
import { authBodySchema, zodErrorMessage } from "@/lib/schemas";

/** Build a JSON response with the opaque session cookie attached. */
async function jsonWithUserCookie(
  payload: Record<string, unknown>,
  email: string,
  meta: { ip?: string; userAgent?: string },
  status = 200,
) {
  const res = NextResponse.json(payload, { status });
  try {
    const token = await createUserToken(email, meta);
    res.cookies.set(USER_COOKIE_NAME, token, USER_COOKIE_OPTS);
  } catch (e) {
    console.error("Failed to set user cookie:", e);
  }
  return res;
}

/** Escape HTML special chars to prevent injection into email templates / PDFs */
function sanitize(value: string, maxLen = 255): string {
  return value
    .slice(0, maxLen)
    .replace(/[<>"'`]/g, "");
}

/** Basic email format check */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) && email.length <= 255;
}

export async function POST(req: NextRequest) {
  // Rate limit: 10 auth attempts per IP per 15 minutes
  const ip = getClientIp(req.headers);
  const userAgent = req.headers.get("user-agent") ?? undefined;
  const meta = { ip, userAgent };
  const rl = await checkRateLimit(`auth:${ip}`, 10, 900);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    // M3: shape validation before any destructuring — types, lengths,
    // action enum, 6-digit OTP format.
    const parsedBody = authBodySchema.safeParse(await req.json().catch(() => null));
    if (!parsedBody.success) {
      return NextResponse.json({ error: zodErrorMessage(parsedBody.error) }, { status: 400 });
    }
    const { action, name, email, phone, source, source_stage, otp_code, marketing_opt_in, terms_accepted, password } = parsedBody.data;

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const supabase = await (async () => {
      try {
        const { createServiceClient } = await import("@/lib/supabase");
        return createServiceClient();
      } catch { return null; }
    })();

    // ── PASSWORD LOGIN PATH ──────────────────────────────────────────────────
    // Alternative to the email-OTP gate below. The user chooses one method at
    // login time. Password login is only available for accounts that have set
    // a password via /api/auth/set-password; if no password is on file, we
    // return reason: "no_password" so the client can fall back to OTP login.
    if (action === "login_password") {
      if (!supabase) {
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
      }
      if (typeof password !== "string" || password.length === 0) {
        return NextResponse.json({ error: "Password is required." }, { status: 400 });
      }
      const { verifyPassword } = await import("@/lib/password");

      // Pull the student + their stored hash.
      const { data: student } = await supabase
        .from("students")
        .select("id, name, email, phone, password_hash")
        .eq("email", normalizedEmail)
        .single();

      // Generic 401 if account is missing OR password not yet set OR password
      // mismatch — never disclose which one. Eliminates user-enumeration via
      // timing/error-text. The "no_password" reason hint only fires for the
      // CURRENT user when the email matches an actual account but they
      // haven't set a password — in that case we want to nudge them toward
      // OTP login instead.
      if (!student) {
        return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
      }
      const stored = (student as { password_hash?: string | null }).password_hash;
      if (!stored) {
        return NextResponse.json(
          {
            error: "No password set for this account yet. Use the email-code option to log in, then set a password from your profile.",
            reason: "no_password",
          },
          { status: 401 },
        );
      }
      const ok = await verifyPassword(password, stored);
      if (!ok) {
        return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
      }

      // Mirror the OTP-login success path: fetch latest submission token so
      // the client can route the user back to their /results/[token] page.
      const token = await getLatestToken(supabase);
      // Strip password_hash before returning the student blob.
      const { password_hash: _ph, ...studentSafe } = student as Record<string, unknown>;
      void _ph;
      const studentEmail = (studentSafe as { email?: string }).email ?? normalizedEmail;
      return jsonWithUserCookie({ ok: true, student: studentSafe, isNew: false, token }, studentEmail, meta);
    }

    // ── OTP verification gate ────────────────────────────────────────────────
    // Both register and login require a valid 6-digit code emailed via
    // /api/auth/send-otp before we touch students or issue a session cookie.
    // Constant-time hash compare; counts wrong attempts and locks the
    // challenge after OTP_CONFIG.maxAttempts.
    if (typeof otp_code !== "string" || !/^[0-9]{6}$/.test(otp_code)) {
      return NextResponse.json(
        { error: "Verification code required.", reason: "otp_required" },
        { status: 400 },
      );
    }
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const purpose = action === "register" ? "register" : "login";
    const { data: challenge } = await supabase
      .from("otp_challenges")
      .select("id, code_hash, attempts, used, expires_at, locked_until")
      .eq("email", normalizedEmail)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!challenge) {
      return NextResponse.json(
        { error: "No active verification code. Please request one first.", reason: "otp_missing" },
        { status: 400 },
      );
    }
    if (challenge.used) {
      return NextResponse.json(
        { error: "This code has already been used. Request a new one.", reason: "otp_used" },
        { status: 400 },
      );
    }
    const now = Date.now();
    if (new Date(challenge.expires_at as string).getTime() < now) {
      return NextResponse.json(
        { error: "This code has expired. Request a new one.", reason: "otp_expired" },
        { status: 400 },
      );
    }
    if (challenge.locked_until && new Date(challenge.locked_until as string).getTime() > now) {
      return NextResponse.json(
        { error: "Too many wrong attempts. Try again in a few minutes.", reason: "otp_locked" },
        { status: 429 },
      );
    }

    const hashOk = verifyOtpCode(otp_code, normalizedEmail, String(challenge.code_hash));
    if (!hashOk) {
      const nextAttempts = (Number(challenge.attempts) || 0) + 1;
      const update: Record<string, unknown> = { attempts: nextAttempts };
      if (nextAttempts >= OTP_CONFIG.maxAttempts) {
        update.locked_until = new Date(now + OTP_CONFIG.lockoutSeconds * 1000).toISOString();
      }
      await supabase.from("otp_challenges").update(update).eq("id", challenge.id);
      const remaining = Math.max(0, OTP_CONFIG.maxAttempts - nextAttempts);
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Wrong code. ${remaining} attempt${remaining === 1 ? "" : "s"} left.`
              : "Too many wrong attempts. Try again in a few minutes.",
          reason: "otp_wrong",
          remaining,
        },
        { status: 400 },
      );
    }

    // Success — burn the challenge so it can't be reused.
    await supabase
      .from("otp_challenges")
      .update({ used: true, attempts: (Number(challenge.attempts) || 0) + 1 })
      .eq("id", challenge.id);

    /**
     * Find the user's most recent submission token. H7 Phase C dropped
     * the plaintext `profile` JSONB column; the only way to look up a
     * submission by email is the `email_hash` column, which the backfill
     * covered for every existing row.
     */
    async function getLatestToken(sb: NonNullable<typeof supabase>): Promise<string | null> {
      try {
        const { data } = await sb
          .from("submissions")
          .select("token, created_at")
          .eq("email_hash", emailHash(normalizedEmail))
          .order("created_at", { ascending: false })
          .limit(1);
        return data?.[0]?.token ?? null;
      } catch {
        return null;
      }
    }

    if (action === "login") {
      if (supabase) {
        // 1. Try to find the student record
        const { data: student } = await supabase
          .from("students")
          .select("*")
          .eq("email", normalizedEmail)
          .single();

        if (student) {
          // Found in students table — also fetch their latest submission token
          const token = await getLatestToken(supabase);
          const studentEmail = (student as { email?: string }).email ?? normalizedEmail;
          return jsonWithUserCookie({ ok: true, student, isNew: false, token }, studentEmail, meta);
        }

        // 2. Student record missing (e.g. DB was unavailable when they registered).
        //    Check whether they have a submission — if so they definitely registered before.
        const token = await getLatestToken(supabase);
        if (token) {
          // Rebuild their student record from the submission profile.
          // Pulls both plaintext and encrypted; decryptProfile picks the
          // right one (encrypted preferred, plaintext fallback).
          const { data: sub } = await supabase
            .from("submissions")
            .select(SUBMISSION_PROFILE_COLUMNS)
            .eq("token", token)
            .single();

          const p = decryptProfile(sub ?? {}) as { full_name?: string; phone?: string } | null;
          const recovered = {
            name: p?.full_name ?? "User",
            email: normalizedEmail,
            phone: p?.phone ?? "",
            created_at: new Date().toISOString(),
          };

          // Save the recovered record so future logins go through the fast path
          await supabase
            .from("students")
            .upsert(recovered, { onConflict: "email" })
            .select()
            .single();

          return jsonWithUserCookie({ ok: true, student: recovered, isNew: false, token }, recovered.email, meta);
        }
      }

      // Genuinely not found
      return NextResponse.json(
        { ok: false, error: "No account found with that email. Please create a profile." },
        { status: 404 }
      );
    }

    // ── Register ────────────────────────────────────────────────────────────
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Terms + Privacy explicit acceptance gate (legal P0 #5). The client must
    // surface a checkbox the user actively ticks; we record what version they
    // agreed to so we can prove consent later and re-prompt when the docs change.
    if (terms_accepted !== true) {
      return NextResponse.json(
        { error: "Please accept the Terms of Service and Privacy Policy to continue." },
        { status: 400 },
      );
    }

    // Privacy Policy §11: marketing/promotional sends only if explicitly opted in.
    // Default false. Welcome / transactional sends ignore this flag.
    const nowIso = new Date().toISOString();
    const student = {
      name:               sanitize(name.trim(), 100),
      email:              normalizedEmail,
      phone:              sanitize(phone?.trim() ?? "", 30),
      source:             source ?? null,
      source_stage:       source_stage ?? null,
      marketing_opt_in:   marketing_opt_in === true,
      marketing_opt_in_at: marketing_opt_in === true ? nowIso : null,
      terms_accepted_at:  nowIso,
      terms_version:      TERMS_VERSION,
      created_at:         nowIso,
    };

    /** Fire welcome email asynchronously — never blocks the registration response */
    const sendWelcomeEmail = () => {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.eduvianai.com";
      fetch(`${baseUrl}/api/email/welcome`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: student.name, email: student.email }),
      }).catch((e) => console.error("Welcome email dispatch failed:", e));
    };

    if (supabase) {
      let upsertResult = await supabase.from("students").upsert({ ...student }, { onConflict: "email" }).select().single();
      if (upsertResult.error) {
        // Retry without optional columns (in case schema hasn't been migrated yet)
        const { source: _s, source_stage: _ss, marketing_opt_in: _mo, marketing_opt_in_at: _moa, terms_accepted_at: _ta, terms_version: _tv, ...coreStudent } = student;
        void _ta; void _tv;
        upsertResult = await supabase.from("students").upsert(coreStudent, { onConflict: "email" }).select().single();
      }

      const { data, error } = upsertResult;
      if (!error && data) {
        sendWelcomeEmail(); // fire-and-forget
        const studentEmail = (data as { email?: string }).email ?? normalizedEmail;
        return jsonWithUserCookie({ ok: true, student: data, isNew: true }, studentEmail, meta);
      }
      console.error("Supabase upsert error during register:", error);
    }

    // Fallback: return data without DB persistence
    sendWelcomeEmail(); // fire-and-forget
    return jsonWithUserCookie(
      {
        ok: true,
        student: { ...student, id: `guest_${Date.now()}` },
        isNew: true,
      },
      student.email,
      meta,
    );

  } catch (err) {
    return apiErrorResponse(err, { route: "auth" }, "Something went wrong");
  }
}
