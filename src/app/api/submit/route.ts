import { NextRequest, NextResponse } from "next/server";
import { recommendPrograms } from "@/lib/scoring";
import { PROGRAMS } from "@/data/programs";
import { submissionStore } from "@/lib/store";
import type { Program, StudentProfile } from "@/lib/types";
import { apiErrorResponse } from "@/lib/api-error";
import { scoreStudentProfile } from "@/lib/profile-score";
import { v4 as uuidv4 } from "uuid";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { checkBetaAccess, logToolUsage } from "@/lib/beta-gate";
import { createUserToken, USER_COOKIE_NAME, USER_COOKIE_OPTS } from "@/lib/user-cookie";

/**
 * Notify admissions@eduvianai.com whenever a profile is submitted. Sent
 * fire-and-forget — failures are silently swallowed by the caller so a
 * Resend outage cannot block the student from getting their results.
 *
 * Uses the same `RESEND_FROM_EMAIL` env var (default `results@eduvianai.com`)
 * as the user-facing emails, so SPF/DKIM/DMARC alignment is identical.
 */
async function sendLeadNotification(
  profile: StudentProfile,
  profileCategory: string,
  totalMatched: number,
  token: string,
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return; // Dev / preview without key — skip silently
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "results@eduvianai.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.eduvianai.com";
  const safe = (s: string | undefined): string => (s ?? "—").toString().slice(0, 200).replace(/[<>"'`]/g, "");
  const subject = `New lead: ${safe(profile.full_name)} (${profileCategory}) — ${totalMatched} matches`;
  const html = `
    <h2>New lead via the profile builder</h2>
    <table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
      <tr><td><b>Name</b></td><td>${safe(profile.full_name)}</td></tr>
      <tr><td><b>Email</b></td><td>${safe(profile.email)}</td></tr>
      <tr><td><b>Phone</b></td><td>${safe(profile.phone)}</td></tr>
      <tr><td><b>City / nationality</b></td><td>${safe(profile.city)} / ${safe(profile.nationality)}</td></tr>
      <tr><td><b>Degree level</b></td><td>${safe(profile.degree_level)}</td></tr>
      <tr><td><b>Intended field</b></td><td>${safe(profile.intended_field)}</td></tr>
      <tr><td><b>Country preference</b></td><td>${safe((profile.country_preferences || []).join(", "))}</td></tr>
      <tr><td><b>Budget</b></td><td>${safe(profile.budget_range)}</td></tr>
      <tr><td><b>Profile category</b></td><td>${safe(profileCategory)}</td></tr>
      <tr><td><b>Matches</b></td><td>${totalMatched}</td></tr>
      <tr><td><b>Token</b></td><td><code>${safe(token)}</code></td></tr>
    </table>
    <p style="margin-top:16px"><a href="${appUrl}/results/${safe(token)}">View their results</a></p>
  `;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `eduvianAI Lead Notifier <${fromEmail}>`,
        reply_to: profile.email, // Replying goes directly to the student
        to: ["admissions@eduvianai.com"],
        subject,
        html,
      }),
    });
  } catch (e) {
    console.error("Lead notification failed:", e);
    // Swallow — never block the student's result from this.
  }
}

export async function POST(req: NextRequest) {
  // Rate limit: 5 submissions per IP per hour
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`submit:${ip}`, 5, 3600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const { profile } = (await req.json()) as { profile: StudentProfile };

    if (!profile?.email || !profile?.full_name) {
      return NextResponse.json(
        { error: "Missing required fields (email, full_name)" },
        { status: 400 }
      );
    }

    // Basic field-length guards
    if (profile.full_name.length > 120 || profile.email.length > 255) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const normalizedEmail = profile.email.toLowerCase().trim();

    // Beta gate (in addition to IP rate limit)
    const gate = await checkBetaAccess(normalizedEmail, "submit-match");
    if (!gate.allowed) {
      return NextResponse.json(
        { error: gate.message, reason: gate.reason },
        { status: gate.reason === "no_user" ? 401 : 403 }
      );
    }

    // Build program list with stable IDs
    let programs: Program[] = PROGRAMS.map((p, i) => ({
      ...p,
      id: `prog_${i}`,
      is_active: true,
      last_updated: new Date().toISOString(),
    }));

    // Try Supabase if configured
    try {
      const { createServiceClient } = await import("@/lib/supabase");
      const supabase = createServiceClient();
      if (supabase) {
        const { data, error } = await supabase
          .from("programs")
          .select("*")
          .eq("is_active", true);
        if (!error && data && data.length > 0) programs = data as Program[];
      }
    } catch {
      // Not configured — use static data
    }

    // Score programs
    const scored = recommendPrograms(profile, programs);

    // Compute profile category
    const profileResult = scoreStudentProfile(profile);
    const profile_category = profileResult.category;
    const total_matched = scored.length;

    const token = uuidv4();
    const id = uuidv4();

    // Try Supabase persistence
    let savedToDb = false;
    try {
      const { createServiceClient } = await import("@/lib/supabase");
      const supabase = createServiceClient();
      if (supabase) {
        const { error } = await supabase.from("submissions").insert({
          id,
          token,
          profile,
          shortlisted_ids: [],
          email_sent: false,
          profile_category,
          total_matched,
        });
        if (!error) savedToDb = true;
      }
    } catch {
      // Fall through to in-memory
    }

    // Always save to in-memory store (serves as cache for results API)
    submissionStore.set(token, {
      id,
      token,
      profile,
      shortlisted_ids: [],
      email_sent: false,
      profile_category,
      total_matched,
      created_at: new Date().toISOString(),
    });

    // Log tool usage so this user counts toward the 100/mo cap
    await logToolUsage(normalizedEmail, "submit-match", ip);

    // Send results email asynchronously (don't block the response)
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    fetch(`${appUrl}/api/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        profile,
        programs: scored.slice(0, 10),
      }),
    }).catch(() => {});

    // Notify admissions@ of every new lead. Fire-and-forget — never blocks
    // the user's response. Uses Resend directly (no internal API roundtrip)
    // so the notification still goes out even if /api/email is rate-limited.
    sendLeadNotification(profile, profile_category, scored.length, token).catch(() => {});

    // Set the user cookie so unregistered submitters become known users.
    const res = NextResponse.json({
      token,
      total: scored.length,
      savedToDb,
    });
    try {
      const userToken = await createUserToken(normalizedEmail);
      res.cookies.set(USER_COOKIE_NAME, userToken, USER_COOKIE_OPTS);
    } catch (e) {
      console.error("Failed to set user cookie:", e);
    }
    return res;
  } catch (err) {
    // Never leak internal details to the client
    return apiErrorResponse(err, { route: "submit" }, "Something went wrong");
  }
}
