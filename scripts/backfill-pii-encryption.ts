/**
 * H7 Phase A backfill — populate email_hash and profile_encrypted on every
 * existing row in public.submissions that was created before the dual-write
 * landed in /api/submit.
 *
 * Idempotent: skips rows that already have both shadow columns populated.
 * Safe to re-run.
 *
 * Run with the same env vars the deployed app uses:
 *   set -a; source .env.local; set +a
 *   npx tsx scripts/backfill-pii-encryption.ts
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 *   PII_ENCRYPTION_KEY
 *   PII_HASH_SECRET
 *
 * Flags:
 *   --dry-run   walk + report counts but don't UPDATE
 *   --batch=N   page size (default 200)
 *   --verbose   log each id touched
 */

import { createClient } from "@supabase/supabase-js";
import { encryptJson, emailHash, isEncryptionConfigured } from "../src/lib/pii-crypto";

interface Args {
  dryRun: boolean;
  batchSize: number;
  verbose: boolean;
}

function parseArgs(argv: string[]): Args {
  const out: Args = { dryRun: false, batchSize: 200, verbose: false };
  for (const a of argv.slice(2)) {
    if (a === "--dry-run") out.dryRun = true;
    else if (a === "--verbose") out.verbose = true;
    else if (a.startsWith("--batch=")) out.batchSize = Math.max(1, parseInt(a.slice(8), 10) || 200);
  }
  return out;
}

interface Row {
  id: string;
  profile: { email?: string } & Record<string, unknown>;
  email_hash: string | null;
  profile_encrypted: string | null;
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

  const args = parseArgs(process.argv);
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  console.log(
    `H7 backfill — dry-run=${args.dryRun}  batch=${args.batchSize}  verbose=${args.verbose}`,
  );

  // Initial census so the operator knows the shape of the work.
  const { count: total, error: countErr } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true });
  if (countErr) {
    console.error("Could not count submissions:", countErr);
    process.exit(1);
  }
  console.log(`Total submissions in DB: ${total ?? 0}`);

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // Walk by created_at to avoid racing with new inserts. We only ever look
  // at rows missing the encrypted shadow — new writes from /api/submit
  // already populate it, so the working set strictly shrinks.
  let cursor: string | null = null;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let q = supabase
      .from("submissions")
      .select("id, profile, email_hash, profile_encrypted, created_at")
      .or("email_hash.is.null,profile_encrypted.is.null")
      .order("created_at", { ascending: true })
      .limit(args.batchSize);
    if (cursor) q = q.gt("created_at", cursor);

    const { data, error } = await q;
    if (error) {
      console.error("Page fetch error:", error);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const row of data as unknown as (Row & { created_at: string })[]) {
      processed += 1;
      cursor = row.created_at;

      if (row.email_hash && row.profile_encrypted) {
        skipped += 1;
        continue;
      }

      const email = (row.profile?.email ?? "").toString();
      if (!email) {
        // No email in profile — encrypt anyway, but skip the hash so we don't
        // index a meaningless empty value.
        try {
          const blob = encryptJson(row.profile);
          if (!args.dryRun) {
            const { error: upErr } = await supabase
              .from("submissions")
              .update({
                profile_encrypted: blob,
                profile_enc_version: 1,
              })
              .eq("id", row.id);
            if (upErr) throw upErr;
          }
          updated += 1;
          if (args.verbose) console.log(`  [no-email] ${row.id}`);
        } catch (e) {
          errors += 1;
          console.error(`  ERR ${row.id}:`, e);
        }
        continue;
      }

      try {
        const hash = emailHash(email);
        const blob = encryptJson(row.profile);
        if (!args.dryRun) {
          const { error: upErr } = await supabase
            .from("submissions")
            .update({
              email_hash: hash,
              profile_encrypted: blob,
              profile_enc_version: 1,
            })
            .eq("id", row.id);
          if (upErr) throw upErr;
        }
        updated += 1;
        if (args.verbose) console.log(`  ok ${row.id}  ${email}`);
      } catch (e) {
        errors += 1;
        console.error(`  ERR ${row.id}:`, e);
      }
    }

    process.stdout.write(
      `\rprocessed=${processed} updated=${updated} skipped=${skipped} errors=${errors}`,
    );

    if (data.length < args.batchSize) break; // last page
  }

  process.stdout.write("\n");
  console.log("Done.");
  console.log(`  processed: ${processed}`);
  console.log(`  updated:   ${updated}${args.dryRun ? " (dry-run, no writes)" : ""}`);
  console.log(`  skipped:   ${skipped} (already encrypted)`);
  console.log(`  errors:    ${errors}`);

  if (errors > 0) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
