/**
 * H7 verification — read every row's profile + profile_encrypted, decrypt
 * the latter, and confirm they match field-for-field. Catches any case
 * where the backfill wrote a blob but the round-trip would yield garbage.
 *
 * Read-only — never modifies any row.
 *
 * Usage:
 *   set -a; source .env.local; set +a
 *   npx tsx scripts/verify-pii-roundtrip.ts
 */

import { createClient } from "@supabase/supabase-js";
import { decryptJson, emailHash, isEncryptionConfigured } from "../src/lib/pii-crypto";

interface Row {
  id: string;
  profile: Record<string, unknown>;
  profile_encrypted: string | null;
  email_hash: string | null;
}

function deepEqual(a: unknown, b: unknown): boolean {
  // Cheap reference + JSON-shape compare. Profiles are plain JSON, no
  // Dates / functions / Maps, so this is sufficient.
  return JSON.stringify(a) === JSON.stringify(b);
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
    process.exit(1);
  }
  if (!isEncryptionConfigured()) {
    console.error("Missing PII_ENCRYPTION_KEY or PII_HASH_SECRET");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await supabase
    .from("submissions")
    .select("id, profile, profile_encrypted, email_hash")
    .not("profile_encrypted", "is", null);
  if (error) {
    console.error("Fetch error:", error);
    process.exit(1);
  }
  const rows = (data ?? []) as unknown as Row[];
  console.log(`Verifying ${rows.length} encrypted row(s)…`);

  let okMatches = 0;
  let mismatches = 0;
  let hashMismatches = 0;
  let decryptErrors = 0;

  for (const r of rows) {
    if (!r.profile_encrypted) continue;
    let decrypted: Record<string, unknown>;
    try {
      decrypted = decryptJson(r.profile_encrypted);
    } catch (e) {
      decryptErrors += 1;
      console.error(`  DECRYPT FAILED ${r.id}:`, e);
      continue;
    }
    if (!deepEqual(decrypted, r.profile)) {
      mismatches += 1;
      console.error(`  MISMATCH ${r.id} — decrypted differs from plaintext`);
      continue;
    }

    // Also confirm the email_hash matches what we'd compute from the email.
    const email = (r.profile?.email ?? "").toString();
    if (email && r.email_hash) {
      const expected = emailHash(email);
      if (expected !== r.email_hash) {
        hashMismatches += 1;
        console.error(`  HASH MISMATCH ${r.id}`);
        continue;
      }
    }

    okMatches += 1;
  }

  console.log("---");
  console.log(`  ok:              ${okMatches}`);
  console.log(`  mismatches:      ${mismatches}`);
  console.log(`  hash mismatches: ${hashMismatches}`);
  console.log(`  decrypt errors:  ${decryptErrors}`);

  if (mismatches || hashMismatches || decryptErrors) {
    console.error("FAIL — at least one row did not round-trip.");
    process.exit(2);
  }
  console.log("PASS — every encrypted row decrypts back to its plaintext.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
