/**
 * admin-audit.ts — closes M6 from the security audit.
 *
 * Every /admin and /api/admin/* surface should call logAdminAction()
 * so incidents can be reconstructed by actor, time, IP and UA.
 *
 * The function is FIRE-AND-FORGET: it never blocks the calling handler,
 * never throws into the response, and silently no-ops if Supabase isn't
 * configured. If the admin_audit table hasn't been created yet (the SQL
 * migration is user-applied per CLAUDE.md Hard Rule 8), the call simply
 * fails quietly — admin routes still serve their data.
 */

import { createServiceClient } from "@/lib/supabase";
import crypto from "node:crypto";

export type AuditActorKind = "email" | "session_hash";

export interface AuditEvent {
  actor: string;
  actor_kind: AuditActorKind;
  action: string;                  // e.g. "session_started", "leads.read"
  target?: string | null;
  metadata?: Record<string, unknown> | null;
  ip?: string | null;
  ua?: string | null;
}

/**
 * Stable hash for an opaque session token so we can correlate
 * per-request rows without storing the token itself.
 */
export function hashSessionToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

/**
 * Read the admin session token from a Request's cookies and return its
 * hash, or null if no cookie. Lets per-request handlers attribute the
 * action to a session without re-decoding the JWT.
 */
export function sessionActorFromHeaders(headers: Headers): string | null {
  const cookieHeader = headers.get("cookie") ?? "";
  const m = /eduvianai_admin_session=([^;]+)/.exec(cookieHeader);
  if (!m) return null;
  return hashSessionToken(m[1]);
}

const MAX_UA = 500;

export function logAdminAction(event: AuditEvent): void {
  // Fire-and-forget — never throws into the calling handler, never blocks.
  (async () => {
    try {
      const supabase = createServiceClient();
      if (!supabase) return;
      await supabase.from("admin_audit").insert({
        actor: event.actor.slice(0, 256),
        actor_kind: event.actor_kind,
        action: event.action.slice(0, 128),
        target: event.target?.slice(0, 256) ?? null,
        metadata: event.metadata ?? null,
        ip: event.ip?.slice(0, 64) ?? null,
        ua: event.ua?.slice(0, MAX_UA) ?? null,
      });
    } catch (e) {
      // Audit-table not yet migrated, transient DB error, etc. — never
      // surface to the caller; just log to server console for diagnosis.
      console.warn("[admin-audit] write failed:", (e as Error)?.message ?? e);
    }
  })();
}
