// Data shared between the HTML view (page.tsx) and the @react-pdf/renderer
// document (pdf-doc.tsx). Static, illustrative — numbers are believable but
// invented; the report's purpose is to let a parent see the exact format
// and depth of the real Parent Decision Report before generating their own.

export const SAMPLE = {
  studentInitial: "Priya M.",
  program: "MS in Computer Science",
  university: "University of Toronto",
  country: "Canada",
  intake: "Fall 2026",
  generatedOn: "Sample · illustrative only",
};

export type Tone = "good" | "warn" | "neutral" | "verdict";

export interface Factor {
  factor: string;
  view: string;
  tone: Tone;
  note: string;
}

export const FACTORS: Factor[] = [
  { factor: "Tuition budget fit",   view: "Good",                tone: "good",    note: "Tuition ₹39.4L over 2 years sits inside the family's stated ceiling of ₹45L." },
  { factor: "Total investment fit", view: "Needs discussion",    tone: "warn",    note: "Total investment ₹65.6L (tuition + living + setup) is ~₹20.6L above the family's ₹45L ceiling. Either revisit the ceiling, target scholarships, or compare a lower-cost program." },
  { factor: "Payback period",       view: "4.8 years",           tone: "neutral", note: "Median CS new-grad salary in Toronto: CAD 78,000 (StatsCan 2025)." },
  { factor: "Safety",               view: "Good",                tone: "good",    note: "Toronto Numbeo safety index 65/100; consistent rating across student forums." },
  { factor: "Job market",           view: "Strong",              tone: "good",    note: "PGWP up to 3 years post-graduation; CS new-grad placement >85% within 6 months." },
  { factor: "Visa readiness",       view: "Medium risk",         tone: "warn",    note: "SDS funds (CAD 22,895) confirmed in GIC. Statement of purpose still needs work." },
  { factor: "Scholarship fit",      view: "Worth applying",      tone: "neutral", note: "OGS and Vector Institute scholarships open in March; deadline 4 weeks out." },
  { factor: "Family verdict",       view: "Worth discussing",    tone: "verdict", note: "Strong on safety, payback and outcomes. Two open items: total investment is above the stated ceiling, and visa SOP needs work." },
];

export const COSTS = [
  { label: "Tuition (2 years)",                amount: "CAD 64,000",   inr: "≈ ₹39.4L", total: false },
  { label: "Living (Toronto, 24 months)",      amount: "CAD 38,400",   inr: "≈ ₹23.6L", total: false },
  { label: "One-time setup (visa, insurance)", amount: "CAD 4,200",    inr: "≈ ₹2.6L",  total: false },
  { label: "Total investment",                 amount: "CAD 106,600",  inr: "≈ ₹65.6L", total: true  },
];

export const ROI = {
  expected_starting_salary: "CAD 78,000 / year",
  five_year_earnings:       "CAD 470,000",
  break_even_year:          "Year 4.8 post-graduation",
  net_value_10yr:           "≈ CAD 612,000 above the no-study baseline",
};

export const RISKS = [
  { tone: "warn" as const, text: "SOP needs strengthening to reduce SDS rejection risk — flagged by SOP Assistant." },
  { tone: "warn" as const, text: "Toronto rent has risen 11% YoY — budget assumes a shared 2BR within 30 min commute." },
  { tone: "ok"   as const, text: "Funds proof, transcripts, IELTS 7.0 already secured." },
];

export const SOURCES = [
  { field: "Tuition fee",            source: "Official university page" },
  { field: "Living cost (Toronto)",  source: "Numbeo + city benchmarks" },
  { field: "Salary projection",      source: "StatsCan + market benchmarks" },
  { field: "Visa requirements",      source: "Canada IRCC official portal" },
];

export const SOURCE_LAST_VERIFIED = "2026-05-01";
