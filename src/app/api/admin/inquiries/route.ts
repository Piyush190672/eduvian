import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { createServiceClient } = await import("@/lib/supabase");
    const supabase = createServiceClient();
    if (supabase) {
      const { data, error } = await supabase
        .from("chat_inquiries")
        .select("id, name, email, phone, question, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        return NextResponse.json({ inquiries: data });
      }
    }
  } catch {
    // table may not exist yet — return empty
  }

  return NextResponse.json({ inquiries: [] });
}
