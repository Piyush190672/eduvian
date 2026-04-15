import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, question } = await req.json() as {
      name: string;
      email: string;
      phone: string;
      question: string;
    };

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
    }

    const record = {
      name: name?.trim() || "Unknown",
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || "",
      question: question?.trim() || "",
      created_at: new Date().toISOString(),
    };

    try {
      const { createServiceClient } = await import("@/lib/supabase");
      const supabase = createServiceClient();
      if (supabase) {
        // Try chat_inquiries table first (create this in Supabase if desired)
        const { error } = await supabase.from("chat_inquiries").insert(record);
        if (error) {
          // Fallback: save to students table so contact is visible in admin
          await supabase
            .from("students")
            .upsert(
              { name: record.name, email: record.email, phone: record.phone, created_at: record.created_at },
              { onConflict: "email" }
            );
        }
      }
    } catch {
      // best-effort — still return success to user
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Chat inquiry error:", err);
    return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
  }
}
