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

export async function POST(req: NextRequest) {
  // Rate limit: 5 submissions per IP per hour
  const ip = getClientIp(req.headers);
  const rl = checkRateLimit(`submit:${ip}`, 5, 3600);
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

    // Send email asynchronously (don't block the response)
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
