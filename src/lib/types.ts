// ─── Student Profile ──────────────────────────────────────────────────────────

export type DegreeLevel = "undergraduate" | "postgraduate";
export type EnglishTest = "ielts" | "toefl" | "pte" | "duolingo" | "none";
export type StdTestUG = "sat" | "act" | "none";
export type StdTestPG = "gre" | "gmat" | "none";
export type BudgetRange =
  | "under_20k"
  | "20k_35k"
  | "35k_50k"
  | "50k_70k"
  | "above_70k";
export type FamilyIncomeINR =
  // Current buckets (17 May 2026 — user-requested re-banding).
  | "under_12L"
  | "12L_24L"
  | "25L_49L"
  | "above_50L"
  // Legacy buckets — kept in the union so old submissions still type-check
  // and decrypt. The form no longer offers them; profile-score maps them
  // to the same points as before so historical ratings stay stable.
  | "under_5L"
  | "5L_10L"
  | "10L_20L"
  | "20L_40L"
  | "above_40L";
export type VisaHistory =
  | "never_applied"
  | "approved_before"
  | "rejected_before";

export interface StudentProfile {
  // Step 1 — Personal
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  city: string;
  passport_available: "yes" | "in_progress" | "no";
  visa_history: VisaHistory;
  family_abroad: boolean;
  family_income_inr: FamilyIncomeINR;

  // Step 2 — Academic
  degree_level: DegreeLevel;
  current_degree: string; // e.g., "12th Grade", "B.Tech"
  major_stream: string;
  institution_name: string;
  graduation_year: number;
  academic_score_type: "gpa" | "percentage" | "ib" | "igcse";
  academic_score: number; // GPA (0–4.0) | percentage (0–100) | IB points (0–45) | IGCSE grade numeric equiv
  backlogs: boolean;
  backlog_count: number;
  academic_gap: boolean;
  // grad only
  work_experience_years?: number;
  work_experience_domain?: string;
  research_papers?: boolean;
  research_paper_count?: number;

  // Step 3 — Tests
  english_test: EnglishTest;
  english_score_overall?: number;
  english_score_listening?: number;
  english_score_reading?: number;
  english_score_writing?: number;
  english_score_speaking?: number;
  std_test_ug?: StdTestUG;
  std_test_ug_score?: number;
  std_test_pg?: StdTestPG;
  /** Composite score. GRE: Verbal+Quant = 260-340. GMAT: Total = 205-805. */
  std_test_pg_score?: number;
  /** GRE Verbal (130-170) OR GMAT Verbal (60-90). Optional — composite still
   *  drives matching; sections are stored for display + future signal
   *  refinement. (14 May 2026.) */
  std_test_pg_verbal?: number;
  /** GRE Quant (130-170) OR GMAT Quant (60-90). */
  std_test_pg_quant?: number;
  /** GRE Analytical Writing Assessment (0-6, 0.5 increments). GRE only. */
  std_test_pg_awa?: number;
  /** GMAT Data Insights (60-90). GMAT only. */
  std_test_pg_data_insights?: number;

  // Step 4 — Preferences
  country_preferences: string[]; // ordered array, up to 10 countries
  country_region_preferences?: Record<string, string[]>; // countryCode → region codes (empty = entire country)
  target_intake_year: number;
  target_intake_semester: "fall" | "spring" | "summer" | "winter";
  budget_range: BudgetRange;
  intended_field: string;
  // Up to TWO additional streams the student is also open to. The matcher
  // unions {intended_field, ...intended_field_extra} when deciding which
  // programs to surface. BPS / MBA branches keep keying off the PRIMARY
  // intended_field so their downstream questions stay coherent. Max length
  // enforced in the form (3 total including the primary). Added 15 May 2026.
  intended_field_extra?: string[];
  // Free-text intended field, set only when intended_field === OTHER_FIELD_SENTINEL
  // ("Others"). Captured from the form, surfaced in admin/emails/PDF in place of
  // "Others", and used by the matching algorithm as a substring filter against
  // p.field_of_study + p.program_name.
  intended_field_custom?: string;
  // Whether the user has already done some self-research on universities for
  // their intended field. Used only by the profile-rating signal (2 points
  // when true) — does not affect program matching. Added 15 May 2026.
  universities_researched?: boolean;
  // BPS GBC accreditation flag — set only when intended_field === "Psychology"
  // AND degree_level === "postgraduate". When false, the matcher filters out
  // programs whose Program.requires_bps_accreditation is true (mainly UK
  // Health / Clinical / Counselling / Forensic / Educational / Occupational
  // / Sport / Neuro Psychology Masters). Added 13 May 2026.
  bps_accredited?: boolean;
  // Hard-filter preferences
  qs_ranking_preference?: "top_50" | "top_100" | "top_200" | "top_500" | "any";
  post_study_work_visa?: boolean;
  // Canada-specific college program types (shown only when Canada is selected)
  canada_college_types?: ("diploma" | "pg_diploma")[];
  // Scoring preference
  scholarship_seeking?: boolean;

  // Marketing opt-in (Privacy Policy §11). Default false. Transactional
  // sends (welcome, match results, tool outputs) are not gated on this;
  // only future bulk / promotional emails honour it. The flag rides on
  // the encrypted profile blob — no new DB column.
  marketing_opt_in?: boolean;

  // MBA-specific (only collected when intended_field === "MBA" and
  // degree_level === "postgraduate"). Top MBAs explicitly weight
  // leadership experience and team size; we surface those questions so
  // the matcher can prefer programs whose admit profile matches.
  mba_team_leading_experience?: boolean;
  mba_max_team_size?: number;
}

// ─── Program ──────────────────────────────────────────────────────────────────

export type ProgramLevel = "undergraduate" | "postgraduate" | "both" | "diploma" | "pg_diploma";

export interface Program {
  id: string;
  university_name: string;
  country: string;
  city: string;
  qs_ranking: number | null;
  program_name: string;
  degree_level: ProgramLevel;
  duration_months: number;
  field_of_study: string;
  /** Cross-listed fields for programs that span multiple streams
   *  (e.g. "MSc Artificial Intelligence and Data Science" lives under
   *  `field_of_study: "Artificial Intelligence"` AND
   *  `field_aliases: ["Data Science"]` so a student picking either
   *  stream finds it). Each entry must be one of FIELDS_OF_STUDY.
   *  Added 14 May 2026 alongside the Cybersecurity / Data Science split. */
  field_aliases?: string[] | null;
  specialization: string;
  annual_tuition_usd: number;
  /** Tuition as literally stated on the official program page, in the page's
   *  own currency. Surface this primarily; treat USD as a derived view. */
  annual_tuition_amount?: number | null;
  /** ISO 4217 currency code matching annual_tuition_amount (GBP, EUR, USD…). */
  annual_tuition_currency?: string | null;
  /** Provenance of the tuition figure:
   *  - undefined / "verified": extracted from the official program page (default).
   *  - "estimated": inferred from a credible secondary source (uni's central
   *    fees page, ranking sites, accreditor pages). UI surfaces this as an
   *    amber "Estimated" pill and ROI/Parent show a caveat banner. */
  tuition_fee_source?: "verified" | "estimated";
  /** Per-program reviewer note for estimates carrying meaningful source
   *  spread (5-20%). When present, the UI tacks this onto the Estimated
   *  pill's tooltip so users see a stronger "verify with the university"
   *  cue than the generic estimated copy. Populated only by the
   *  prior-year-fees pass when spread between two sources is ≥ 5%. */
  tuition_estimate_note?: string | null;
  avg_living_cost_usd: number;
  avg_living_cost_amount?: number | null;
  avg_living_cost_currency?: string | null;
  /** Provenance of the living-cost figure (Wave B, 17 May 2026):
   *  - undefined / "country_avg": country-mean default. Indicates this
   *    is NOT city-specific (e.g., London and Sheffield would otherwise
   *    share the same UK mean). UI shows "Country average — adjust to
   *    your city" so the user knows they can override.
   *  - "city": city-level estimate from src/data/city-living-costs.ts,
   *    backed by a published gov / immigration / university source. UI
   *    shows the source citation on hover. */
  living_cost_source?: "country_avg" | "city";
  intake_semesters: string[]; // ["fall", "spring", etc.]
  application_deadline: string | null; // ISO date or "rolling"
  min_gpa: number | null;
  min_percentage: number | null;
  min_ielts: number | null;
  min_toefl: number | null;
  min_pte: number | null;
  min_duolingo: number | null;
  min_gre: number | null;
  min_gmat: number | null;
  min_sat: number | null;
  // Realistic admission bars — typical median admit profile rather than
  // the published floor. Populated only for QS top-100 universities via
  // the realistic-admit-extractor sweep (13 May 2026). Scoring (academic
  // / std_test / english) prefers these over min_* when present.
  // Unset on the rest of the DB — scoring falls back to the published
  // min_* fields, which is fine for less-selective programs where the
  // published floor ≈ the realistic bar.
  realistic_min_gpa?: number | null;
  realistic_min_percentage?: number | null;
  realistic_min_ielts?: number | null;
  realistic_min_toefl?: number | null;
  realistic_min_gre?: number | null;
  realistic_min_gmat?: number | null;
  realistic_min_sat?: number | null;
  realistic_source?: string | null;       // e.g. "U.S. News 2024 median admit"
  realistic_extracted_at?: string | null; // ISO timestamp
  work_exp_required_years: number | null;
  program_url: string;
  apply_url: string | null;
  is_active: boolean;
  last_updated: string;
  /** ISO timestamp when fields on this entry were last confirmed against the official program page. Null/undefined = never verified. */
  verified_at?: string | null;
  /** URL whose live content the verification was performed against (typically same as program_url, captured at verification time). */
  verification_source_url?: string | null;
  /** True when this program requires applicants to hold the BPS Graduate
   *  Basis for Chartered Membership (GBC) — typical for UK Health /
   *  Clinical / Counselling / Forensic / Educational / Occupational /
   *  Sport / Neuro Psychology Masters. When true, candidates without a
   *  BPS-accredited undergraduate degree are filtered out of matches.
   *  Undefined / false = no BPS requirement (Conversion MSc, generic MSc
   *  Psychology, all non-UK psych programs). Added 13 May 2026. */
  requires_bps_accreditation?: boolean;
}

// ─── University (sidecar to Program) ─────────────────────────────────────────
//
// University-level facts that are CONSTANT across every Program at the same
// university. Kept as a sidecar table rather than denormalised onto every
// Program row so we don't write the same Cornell acceptance rate to ~17
// program rows with drift risk on each re-verify (14 May 2026).
//
// Coverage builds in stages:
//   - Stage 2 (planned): College Scorecard API → US universities
//   - Stage 3 (planned): HESA / Discover Uni → UK universities
//   - Stage 4 (planned): Claude web_search via QS profile + US News Global
//                        for non-US / non-UK universities
//
// Lookups: use lookupUniversity(name) from src/data/universities-helpers.ts;
// it canonicalises whitespace / "The " / "&"→"and" before matching.

export interface University {
  /** URL-safe slug derived from `name`; stable primary key. */
  id: string;
  /** Canonical display name. Must match a Program.university_name (after
   *  normalisation) for the lookup to resolve. */
  name: string;
  country: string;

  /** Admission acceptance rate as a percentage (0-100). Null = unknown. */
  acceptance_rate?: number | null;
  /** Median annual earnings of graduates 6 years after enrolment, USD. */
  median_earnings_6yr_usd?: number | null;
  /** Median annual earnings of graduates 10 years after enrolment, USD. */
  median_earnings_10yr_usd?: number | null;
  /** Public vs private (with NFP/FP split where US Scorecard provides it). */
  school_type?: "public" | "private_nonprofit" | "private_forprofit" | "private" | null;
  /** Locale of the main campus. */
  setting?: "urban" | "suburban" | "rural" | null;
  /** Total undergraduate enrolment headcount. */
  enrollment_undergrad?: number | null;

  // ── Stage 3 additions (14 May 2026, per user request) ────────────────────
  /** Total enrolment headcount (UG + PG combined). */
  enrollment_total?: number | null;
  /** Median graduate salary, converted to USD. Source-specific timing:
   *  UK HESA Graduate Outcomes = 15 months after grad;
   *  US Scorecard separately tracks 6yr / 10yr in median_earnings_*_usd. */
  graduate_outcome_salary_usd?: number | null;
  /** % of graduates in employment or further study. UK HESA = 15 months
   *  after grad; US Scorecard tracks separately. 0-100. */
  graduate_outcome_employment_pct?: number | null;
  /** UK Provider Reference Number (HESA/OfS join key). UK only. */
  ukprn?: number | null;
  /** Students-per-academic-staff. Lower = more individual attention. */
  student_staff_ratio?: number | null;
  /** National Student Survey overall satisfaction %. UK only. 0-100. */
  nss_satisfaction_pct?: number | null;
  /** Teaching Excellence Framework rating. UK only. */
  tef_rating?: "gold" | "silver" | "bronze" | "provisional" | null;
  /** Member of the Russell Group (24 research-intensive UK universities). */
  russell_group?: boolean | null;
  /** % of starters who complete the qualification within expected time + grace. 0-100. */
  completion_rate_pct?: number | null;
  // ───────────────────────────────────────────────────────────────────────

  /** Free-form citation: "College Scorecard 2024", "QS Profile 2024", "HESA Outcomes 2023" */
  data_source?: string | null;
  /** ISO timestamp when this row was last refreshed. */
  data_extracted_at?: string | null;
}

// ─── Recommendation Result ────────────────────────────────────────────────────

export type ProgramTier = "safe" | "reach" | "ambitious";

export interface ScoredProgram extends Program {
  match_score: number;
  tier: ProgramTier;
  score_breakdown: {
    academic: number;
    english: number;
    budget: number;
    scholarship: number;
    intake: number;
    work_experience: number;
    std_test: number;
    backlogs: number;
    gap_year: number;
    research_paper: number;
  };
}

// ─── Submission ───────────────────────────────────────────────────────────────

export interface Submission {
  id: string;
  token: string;
  profile: StudentProfile;
  shortlisted_ids: string[];
  created_at: string;
  email_sent: boolean;
  profile_category?: string; // computed from profile-score.ts
}

// ─── Countries ────────────────────────────────────────────────────────────────

export const TARGET_COUNTRIES = [
  { code: "US", name: "USA", flag: "🇺🇸" },
  { code: "GB", name: "UK", flag: "🇬🇧" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
] as const;

export type CountryCode = (typeof TARGET_COUNTRIES)[number]["code"];

export const FIELDS_OF_STUDY = [
  "Computer Science & IT",
  "Artificial Intelligence",
  "Data Science",
  "Cybersecurity",
  "Business & Management",
  "MBA",
  "Engineering (Mechanical/Civil/Electrical)",
  "Architecture",
  "Biotechnology & Life Sciences",
  "Medicine & Public Health",
  "Law",
  "Arts and Design",
  "Social Sciences & Humanities",
  "Psychology",
  "Economics & Finance",
  "Media & Communications",
  "Environmental & Sustainability Studies",
  "Natural Sciences",
  "Nursing & Allied Health",
  "Agriculture & Veterinary Sciences",
  "Hospitality & Tourism",
] as const;

// Sentinel value the form sets on profile.intended_field when the user
// picks "Others" from the dropdown. The free-text the user types goes
// into profile.intended_field_custom. Matching falls back to a
// case-insensitive substring search across program field + name when
// intended_field === OTHER_FIELD_SENTINEL.
export const OTHER_FIELD_SENTINEL = "Others" as const;

// Resolves the effective intended-field label for display surfaces (admin
// tables, ProfileCard, email, PDF). When the user picked "Others" and typed
// a custom stream, those screens should show the typed stream — not the
// literal "Others" sentinel. Falls back to "Others" if the custom text is
// somehow empty (shouldn't happen — form validation blocks submit — but
// defensive).
export function intendedFieldLabel(p: {
  intended_field?: string;
  intended_field_custom?: string;
}): string {
  if (p.intended_field === OTHER_FIELD_SENTINEL) {
    const custom = (p.intended_field_custom ?? "").trim();
    return custom ? `${custom} (Other)` : OTHER_FIELD_SENTINEL;
  }
  return p.intended_field ?? "";
}

// ─── Country Regions ──────────────────────────────────────────────────────────
// Used for sub-country filtering in preferences and matching.
// `match` = state codes (US) or city keywords (all other countries).
// An empty `match` array means "entire country" — no city filter applied.

export type CountryRegion = { code: string; label: string; match: string[] };

export const COUNTRY_REGIONS: Record<string, CountryRegion[]> = {
  US: [
    { code: "east_coast",  label: "East Coast",            match: ["MA","CT","RI","NY","NJ","PA","DE","MD","DC","VA","NC","SC","GA","FL","NH","VT","ME"] },
    { code: "west_coast",  label: "West Coast",            match: ["CA","WA","OR"] },
    { code: "midwest",     label: "Midwest",               match: ["IL","IN","OH","MI","WI","MN","IA","MO","ND","SD","NE","KS"] },
    { code: "south",       label: "South",                 match: ["TX","OK","AR","LA","MS","AL","TN","KY","WV"] },
    { code: "southwest",   label: "Mountain / Southwest",  match: ["AZ","NM","CO","UT","NV"] },
    { code: "entire",      label: "Entire USA",            match: [] },
  ],
  GB: [
    { code: "london",           label: "London",                       match: ["London"] },
    { code: "scotland",         label: "Scotland",                     match: ["Edinburgh","Glasgow","St Andrews","Aberdeen","Dundee","Stirling","Inverness"] },
    { code: "north_england",    label: "North England",                match: ["Manchester","Leeds","Sheffield","Newcastle","Liverpool","Lancaster","York","Sunderland","Hull","Bradford","Huddersfield","Middlesbrough","Durham"] },
    { code: "midlands",         label: "Midlands",                     match: ["Birmingham","Nottingham","Leicester","Coventry","Loughborough","Keele","Lincoln","Wolverhampton","Worcester","Stoke","Northampton","Chester","Derby"] },
    { code: "south_england",    label: "South England (excl. London)", match: ["Bristol","Bath","Southampton","Exeter","Reading","Oxford","Cambridge","Canterbury","Brighton","Portsmouth","Plymouth","Bournemouth","Gloucester","Guildford","Egham","Surrey","Norwich","Colchester"] },
    { code: "wales",            label: "Wales",                        match: ["Cardiff","Swansea","Bangor","Newport"] },
    { code: "northern_ireland", label: "Northern Ireland",             match: ["Belfast","Coleraine","Derry","Jordanstown"] },
    { code: "entire",           label: "Entire UK",                    match: [] },
  ],
  AU: [
    { code: "nsw",         label: "NSW (Sydney)",           match: ["Sydney","Wollongong","Newcastle","Lismore","Bathurst","Armidale","Penrith"] },
    { code: "victoria",    label: "Victoria (Melbourne)",   match: ["Melbourne","Geelong","Ballarat","Bendigo","Bundoora","Burwood"] },
    { code: "queensland",  label: "Queensland (Brisbane)",  match: ["Brisbane","Gold Coast","Townsville","Cairns","Rockhampton","Toowoomba","Sunshine Coast"] },
    { code: "wa",          label: "Western Australia",      match: ["Perth","Fremantle","Murdoch","Joondalup"] },
    { code: "sa",          label: "South Australia",        match: ["Adelaide","Whyalla","Mount Gambier","Bedford Park"] },
    { code: "act",         label: "ACT (Canberra)",         match: ["Canberra","Bruce"] },
    { code: "nt_tasmania", label: "NT & Tasmania",          match: ["Darwin","Hobart","Launceston","Casuarina"] },
    { code: "entire",      label: "Entire Australia",       match: [] },
  ],
  CA: [
    { code: "ontario",   label: "Ontario (Toronto / Ottawa)",       match: ["Toronto","Ottawa","Waterloo","Hamilton","Kingston","London, ON","Windsor","Guelph","Oshawa","Thunder Bay"] },
    { code: "quebec",    label: "Québec (Montréal)",                match: ["Montreal","Montréal","Quebec City","Québec","Sherbrooke","Laval"] },
    { code: "bc",        label: "British Columbia (Vancouver)",     match: ["Vancouver","Victoria","Burnaby","Surrey","Kelowna","Abbotsford"] },
    { code: "alberta",   label: "Alberta (Calgary / Edmonton)",     match: ["Calgary","Edmonton","Lethbridge","Red Deer"] },
    { code: "maritimes", label: "Prairies & Maritimes",             match: ["Halifax","Fredericton","Saskatoon","Regina","Winnipeg","Moncton","Saint John","Sackville"] },
    { code: "entire",    label: "Entire Canada",                    match: [] },
  ],
  NZ: [
    { code: "auckland",      label: "Auckland",                          match: ["Auckland"] },
    { code: "wellington",    label: "Wellington",                        match: ["Wellington"] },
    { code: "christchurch",  label: "Canterbury (Christchurch)",         match: ["Christchurch","Lincoln"] },
    { code: "dunedin",       label: "Otago (Dunedin)",                   match: ["Dunedin"] },
    { code: "other_nz",      label: "Other (Hamilton / Palmerston Nth)", match: ["Hamilton","Palmerston North","Tauranga","Nelson"] },
    { code: "entire",        label: "Entire New Zealand",                match: [] },
  ],
  IE: [
    { code: "dublin",          label: "Dublin",          match: ["Dublin"] },
    { code: "cork",            label: "Cork",            match: ["Cork"] },
    { code: "galway_limerick", label: "Galway / Limerick", match: ["Galway","Limerick"] },
    { code: "entire",          label: "Entire Ireland",  match: [] },
  ],
  DE: [
    { code: "bavaria",   label: "Bavaria (Munich / Nuremberg)",       match: ["Munich","Nuremberg","Augsburg","Regensburg","Passau"] },
    { code: "berlin",    label: "Berlin",                             match: ["Berlin"] },
    { code: "nrw",       label: "NRW (Cologne / Aachen / Münster)",   match: ["Cologne","Aachen","Münster","Dortmund","Düsseldorf","Bochum","Essen","Bielefeld","Wuppertal"] },
    { code: "bw",        label: "Baden-Württemberg (Stuttgart / Heidelberg)", match: ["Stuttgart","Heidelberg","Karlsruhe","Freiburg","Tübingen","Konstanz","Mannheim","Ulm"] },
    { code: "other_de",  label: "Other Germany",                      match: ["Hamburg","Frankfurt","Hannover","Göttingen","Dresden","Leipzig","Bremen","Kiel","Rostock","Halle","Kassel"] },
    { code: "entire",    label: "Entire Germany",                     match: [] },
  ],
  FR: [
    { code: "paris",     label: "Paris & Île-de-France",              match: ["Paris","Fontainebleau","Cergy","Saclay","Palaiseau","Gif-sur-Yvette","Versailles"] },
    { code: "south_fr",  label: "South France (Marseille / Nice)",    match: ["Marseille","Montpellier","Nice","Aix-en-Provence","Toulon"] },
    { code: "other_fr",  label: "Other France",                       match: ["Lyon","Grenoble","Strasbourg","Bordeaux","Toulouse","Lille","Nantes","Rennes","Clermont-Ferrand"] },
    { code: "entire",    label: "Entire France",                      match: [] },
  ],
  AE: [
    { code: "dubai",     label: "Dubai",      match: ["Dubai"] },
    { code: "abu_dhabi", label: "Abu Dhabi",  match: ["Abu Dhabi"] },
    { code: "sharjah",   label: "Sharjah",    match: ["Sharjah"] },
    { code: "entire",    label: "Entire UAE", match: [] },
  ],
  SG: [
    { code: "entire", label: "Singapore", match: [] },
  ],
  MY: [
    { code: "kl",       label: "KL / Selangor",  match: ["Kuala Lumpur","Subang Jaya","Petaling Jaya","Shah Alam","Cyberjaya","Putrajaya","Klang"] },
    { code: "penang",   label: "Penang",          match: ["Penang","George Town","Bayan Lepas"] },
    { code: "johor",    label: "Johor",           match: ["Johor Bahru","Skudai","Johor"] },
    { code: "other_my", label: "Other Malaysia",  match: ["Kota Kinabalu","Kuching","Ipoh","Kota Bharu","Kedah","Terengganu","Perak"] },
    { code: "entire",   label: "Entire Malaysia", match: [] },
  ],
};

export const BUDGET_LABELS: Record<BudgetRange, string> = {
  under_20k: "Under $20,000/yr",
  "20k_35k": "$20,000 – $35,000/yr",
  "35k_50k": "$35,000 – $50,000/yr",
  "50k_70k": "$50,000 – $70,000/yr",
  above_70k: "$70,000+/yr",
};

export const BUDGET_VALUES: Record<BudgetRange, number> = {
  under_20k: 20000,
  "20k_35k": 35000,
  "35k_50k": 50000,
  "50k_70k": 70000,
  above_70k: 100000,
};
