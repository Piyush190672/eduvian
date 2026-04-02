/**
 * In-memory submission store — used as fallback when Supabase is not configured.
 * In production this lives in Supabase. For demo/dev, this module is shared
 * via Node's module cache across API routes.
 */

import type { StudentProfile } from "./types";

export interface StoredSubmission {
  id: string;
  token: string;
  profile: StudentProfile;
  shortlisted_ids: string[];
  email_sent: boolean;
  created_at: string;
  profile_category?: string;
}

// Singleton map that persists across hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var __submissionStore: Map<string, StoredSubmission> | undefined;
}

export const submissionStore: Map<string, StoredSubmission> =
  globalThis.__submissionStore ?? (globalThis.__submissionStore = new Map());
