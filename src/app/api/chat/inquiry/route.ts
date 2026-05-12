import { NextRequest, NextResponse } from "next/server";
import { captureApiError } from "@/lib/api-error";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // M8: cap inquiries (20/h per IP) — these write to the chat_inquiries
    // table; uncapped, a bot could fill it.
    const ip = getClientIp(req.headers);
    const rl = await checkRateLimit(`chat-inquiry:${ip}`, 20, 3600);
    if (!rl.ok) return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } });

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
    captureApiError(err, { route: "chat/inquiry" });
    return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
  }
}
