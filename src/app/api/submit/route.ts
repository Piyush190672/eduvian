import { NextRequest, NextResponse } from "next/server";
import { recommendPrograms } from "@/lib/scoring";
import { PROGRAMS } from "@/data/programs";
import { submissionStore } from "@/lib/store";
import type { Program, StudentProfile } from "@/lib/types";
import { scoreStudentProfile } from "@/lib/profile-score";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { profile } = (await req.json()) as { profile: StudentProfile };

    if (!profile?.email || !profile?.full_name) {
      return NextResponse.json(
        { error: "Missing required fields (email, full_name)" },
        { status: 400 }
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
      created_at: new Date().toISOString(),
    });

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

    return NextResponse.json({
      token,
      total: scored.length,
      savedToDb,
    });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
