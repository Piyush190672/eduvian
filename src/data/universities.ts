// University-level sidecar table.
//
// Stays SEPARATE from programs.ts on purpose: every Program has the same
// Cornell acceptance rate, the same Yale median earnings, the same MIT
// setting — denormalising those fields onto each Program row would mean
// ~17 copies per university and a drift risk on every re-verify pass.
// One row per ~545 unique universities lives here instead.
//
// Population happens in later stages (College Scorecard for US,
// HESA / Discover Uni for UK, QS profile + US News Global Universities
// for non-US/non-UK). This file starts empty; helpers in
// `universities-helpers.ts` resolve a Program.university_name to a
// University row when one exists and return null otherwise.

import type { University } from "@/lib/types";

// @ts-nocheck — kept lightweight; the array gets typed by the export
// signature below. Once the file grows past ~500 entries we'll move to
// the same large-data-file pattern used by programs.ts.

export const UNIVERSITIES: University[] = [
  // Populated by Stage 2 (College Scorecard sweep) onward.
];
