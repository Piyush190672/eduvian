import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, name, email, phone } = body as {
      action: "register" | "login";
      name?: string;
      email: string;
      phone?: string;
    };

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
    const student = {
      name: name!.trim(),
      email: normalizedEmail,
      phone: phone?.trim() ?? "",
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("students")
        .upsert({ ...student }, { onConflict: "email" })
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ ok: true, student: data, isNew: true });
      }
      console.error("Supabase upsert error during register:", error);
    }

    // Fallback: return data without DB persistence
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
