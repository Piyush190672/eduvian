import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

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
  const rl = checkRateLimit(`auth:${ip}`, 10, 900);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const { action, name, email, phone, source, source_stage } = body as {
      action: "register" | "login";
      name?: string;
      email: string;
      phone?: string;
      source?: string;
      source_stage?: number;
    };

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

    /** Look up the most recent submission token for this email (stored in the
     *  JSONB `profile` column of the `submissions` table). */
    async function getLatestToken(sb: NonNullable<typeof supabase>): Promise<string | null> {
      try {
        const { data } = await sb
          .from("submissions")
          .select("token, created_at")
          .filter("profile->>email", "eq", normalizedEmail)
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
          return NextResponse.json({ ok: true, student, isNew: false, token });
        }

        // 2. Student record missing (e.g. DB was unavailable when they registered).
        //    Check whether they have a submission — if so they definitely registered before.
        const token = await getLatestToken(supabase);
        if (token) {
          // Rebuild their student record from the submission profile
          const { data: sub } = await supabase
            .from("submissions")
            .select("profile")
            .eq("token", token)
            .single();

          const p = sub?.profile as { full_name?: string; phone?: string } | null;
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

          return NextResponse.json({ ok: true, student: recovered, isNew: false, token });
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

    const student = {
      name:         sanitize(name.trim(), 100),
      email:        normalizedEmail,
      phone:        sanitize(phone?.trim() ?? "", 30),
      source:       source ?? null,
      source_stage: source_stage ?? null,
      created_at:   new Date().toISOString(),
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
        const { source: _s, source_stage: _ss, ...coreStudent } = student;
        upsertResult = await supabase.from("students").upsert(coreStudent, { onConflict: "email" }).select().single();
      }

      const { data, error } = upsertResult;
      if (!error && data) {
        sendWelcomeEmail(); // fire-and-forget
        return NextResponse.json({ ok: true, student: data, isNew: true });
      }
      console.error("Supabase upsert error during register:", error);
    }

    // Fallback: return data without DB persistence
    sendWelcomeEmail(); // fire-and-forget
    return NextResponse.json({
      ok: true,
      student: { ...student, id: `guest_${Date.now()}` },
      isNew: true,
    });

  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
