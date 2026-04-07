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

    const supabase = await (async () => {
      try {
        const { createServiceClient } = await import("@/lib/supabase");
        return createServiceClient();
      } catch { return null; }
    })();

    if (action === "login") {
      // Look up existing student by email
      if (supabase) {
        const { data } = await supabase
          .from("students")
          .select("*")
          .eq("email", email.toLowerCase().trim())
          .single();

        if (data) {
          return NextResponse.json({ ok: true, student: data, isNew: false });
        }
      }
      // Not found
      return NextResponse.json({ ok: false, error: "No account found with that email. Please create a profile." }, { status: 404 });
    }

    // Register
    const student = {
      name: name!.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() ?? "",
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      // Upsert on email
      const { data, error } = await supabase
        .from("students")
        .upsert({ ...student }, { onConflict: "email" })
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({ ok: true, student: data, isNew: true });
      }
    }

    // Fall back: return the data without DB persistence
    return NextResponse.json({ ok: true, student: { ...student, id: `guest_${Date.now()}` }, isNew: true });

  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
