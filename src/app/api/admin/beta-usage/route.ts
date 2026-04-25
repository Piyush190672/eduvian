import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { MONTHLY_UNIQUE_USER_CAP } from "@/lib/beta-gate";

export async function GET() {
  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({
      uniqueUsers: 0,
      totalCalls: 0,
      cap: MONTHLY_UNIQUE_USER_CAP,
      byTool: [],
      configured: false,
    });
  }

  // Start of current calendar month, UTC.
  const now = new Date();
  const startOfMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  ).toISOString();

  try {
    const { data, error } = await supabase
      .from("tool_usage")
      .select("email, tool")
      .gte("created_at", startOfMonth);

    if (error) throw error;

    const rows = (data ?? []) as { email: string; tool: string }[];
    const totalCalls = rows.length;
    const uniqueUsers = new Set(rows.map((r) => r.email.toLowerCase())).size;

    // Aggregate by tool
    const toolMap = new Map<string, { calls: number; users: Set<string> }>();
    for (const r of rows) {
      const entry = toolMap.get(r.tool) ?? { calls: 0, users: new Set<string>() };
      entry.calls += 1;
      entry.users.add(r.email.toLowerCase());
      toolMap.set(r.tool, entry);
    }
    const byTool = Array.from(toolMap.entries())
      .map(([tool, v]) => ({ tool, calls: v.calls, users: v.users.size }))
      .sort((a, b) => b.calls - a.calls);

    return NextResponse.json({
      uniqueUsers,
      totalCalls,
      cap: MONTHLY_UNIQUE_USER_CAP,
      byTool,
      configured: true,
    });
  } catch (err) {
    console.error("beta-usage error:", err);
    return NextResponse.json(
      { error: "Failed to load beta usage" },
      { status: 500 }
    );
  }
}
