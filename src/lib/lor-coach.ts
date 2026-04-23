// LOR Coach — shared types + brief encoding/decoding for shareable links.
//
// The brief is encoded into the URL path as base64url-JSON so the recommender
// can open the link on any device/browser without any server-side persistence.
// Briefs are small (< 1KB) so URL length stays well within limits.

export interface LorProgram {
  university_name: string;
  program_name: string;
  degree_level?: string;
  country?: string;
}

export interface LorBrief {
  // Student-provided ("ask" side)
  student_name: string;
  student_email: string;
  recommender_name: string;
  recommender_role: string;      // e.g. "Professor of Electrical Engineering, IIT Madras"
  recommender_context: string;   // e.g. "supervised my final-year thesis on power systems, 2023-24"
  applicant_highlights: string;  // free-text the student wants woven in — projects, traits, stories
  target_programs: LorProgram[]; // up to 6
  deadline?: string;             // optional ISO date
  field_of_interest?: string;
  created_at: string;            // ISO
}

// ── Encode / decode ─────────────────────────────────────────────────────────

function base64urlEncode(input: string): string {
  // Works in both Node and browser
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(input, "utf-8").toString("base64")
      : btoa(unescape(encodeURIComponent(input)));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  if (typeof Buffer !== "undefined") {
    return Buffer.from(b64 + pad, "base64").toString("utf-8");
  }
  return decodeURIComponent(escape(atob(b64 + pad)));
}

export function encodeBrief(brief: LorBrief): string {
  return base64urlEncode(JSON.stringify(brief));
}

export function decodeBrief(token: string): LorBrief | null {
  try {
    const raw = base64urlDecode(token);
    const parsed = JSON.parse(raw) as LorBrief;
    if (!parsed.student_name || !parsed.recommender_name) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ── Recommender-side inputs ─────────────────────────────────────────────────

export interface RecommenderInputs {
  how_long_known: string;          // "3 years"
  capacity: string;                // "as her thesis advisor and CS205 instructor"
  comparative_rank: string;        // "top 2 of ~60 students I've supervised in the last decade"
  standout_moments: string;        // 2-3 concrete stories the recommender personally observed
  strengths_to_emphasise: string;  // which of the brief's highlights to double down on
  specific_concerns?: string;      // anything they want to proactively address (e.g. low grade in one course)
  tone: "formal" | "warm" | "detailed";
}

export interface GeneratedLetter {
  program_key: string; // "University — Program"
  letter: string;
  word_count: number;
  program_specifics_used: string[];
}
