import { NextResponse, type NextRequest } from "next/server";
import { logAdminAction, sessionActorFromHeaders } from "@/lib/admin-audit";
import { getClientIp, checkRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`admin-inquiries:${ip}`, 100, 3600);
  if (!rl.ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  const actor = sessionActorFromHeaders(req.headers);
  logAdminAction({
    actor: actor ?? "unknown",
    actor_kind: "session_hash",
    action: "inquiries.read",
    ip,
    ua: req.headers.get("user-agent"),
  });
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
