import { NextResponse, type NextRequest } from "next/server";
import { createSessionToken } from "@/lib/session";
import { createServiceClient } from "@/lib/supabase";
import { isOwnerEmail } from "@/lib/beta-gate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const COOKIE_NAME = "eduvianai_admin_session";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

// POST — verify Supabase JWT + owner allowlist, then issue admin cookie
export async function POST(req: NextRequest) {
  // Brute-force guard for the admin login flow.
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimit(`admin-session:${ip}`, 20, 900);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } }
    );
  }

  const auth = req.headers.get("authorization") ?? "";
  const m = /^Bearer\s+(.+)$/i.exec(auth.trim());
  if (!m) {
    return NextResponse.json({ ok: false, error: "missing_bearer_token" }, { status: 401 });
  }
  const jwt = m[1];

  const supabase = createServiceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "auth_unavailable" }, { status: 503 });
  }

  const { data, error } = await supabase.auth.getUser(jwt);
  if (error || !data?.user?.email) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }

  if (!isOwnerEmail(data.user.email)) {
    return NextResponse.json({ ok: false, error: "not_authorized" }, { status: 403 });
  }

  // H1: enforce AAL2 if the user has any verified MFA factor.
  // - If they have a verified factor, the JWT must carry aal=aal2 (i.e.
  //   they completed MFA in this session). Otherwise reject with
  //   mfa_required so the client knows to challenge.
  // - If they have no factors enrolled, aal1 is fine.
  // Decoding the unsigned middle of the JWT is safe here — getUser above
  // already verified the signature; we're only reading already-trusted
  // claims.
  type FactorLike = { factor_type?: string; status?: string };
  const factors = (data.user.factors as FactorLike[] | undefined) ?? [];
  const hasVerifiedTotp = factors.some((f) => f?.factor_type === "totp" && f?.status === "verified");
  if (hasVerifiedTotp) {
    let aal: string | null = null;
    try {
      const payload = JSON.parse(
        Buffer.from(jwt.split(".")[1] ?? "", "base64").toString("utf8"),
      ) as { aal?: string };
      aal = payload.aal ?? null;
    } catch {
      // Malformed token shouldn't have got past getUser, but be defensive.
    }
    if (aal !== "aal2") {
      return NextResponse.json(
        { ok: false, error: "mfa_required" },
        { status: 403 },
      );
    }
  }

  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, token, { ...COOKIE_OPTS, maxAge: 60 * 60 * 8 }); // 8 h
  return res;
}

// DELETE — called on logout to clear the session cookie
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTS, maxAge: 0 });
  return res;
}
