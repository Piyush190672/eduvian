import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/user-cookie";
import { createServiceClient } from "@/lib/supabase";
import { apiErrorResponse } from "@/lib/api-error";

// Reads the session cookie — must be evaluated per-request, never statically.
export const dynamic = "force-dynamic";

/** Accepted, sanitised, length-capped fields for self-service correction. */
function clean(value: unknown, maxLen: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen).replace(/[<>"'`]/g, "");
}

/**
 * DPDPA s.13 / GDPR Art.16 — right to rectification.
 * Lets a signed-in user correct their own contact details. Email is
 * intentionally not editable here (it's the identity key — changing it is
 * effectively account migration, which we do not support yet).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in to update your data." }, { status: 401 });
    }
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      phone?: string;
    };

    const updates: Record<string, string> = {};
    const name = clean(body.name, 100);
    const phone = clean(body.phone, 30);
    if (name !== null) updates.name = name;
    if (phone !== null) updates.phone = phone;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update. Provide name and/or phone." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("students")
      .update(updates)
      .eq("email", user.email)
      .select()
      .maybeSingle();

    if (error) {
      console.error("account/correct update error:", error);
      return NextResponse.json({ error: "Could not update your data" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, student: data ?? null });
  } catch (err) {
    return apiErrorResponse(err, { route: "account/correct" }, "Could not update your data");
  }
}
