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
  std_test_pg_score?: number;

  // Step 4 — Preferences
  country_preferences: string[]; // ordered array, up to 10 countries
  country_region_preferences?: Record<string, string[]>; // countryCode → region codes (empty = entire country)
  target_intake_year: number;
  target_intake_semester: "fall" | "spring" | "summer" | "winter";
  budget_range: BudgetRange;
  intended_field: string;
  // Hard-filter preferences
  qs_ranking_preference?: "top_50" | "top_100" | "top_200" | "top_500" | "any";
  post_study_work_visa?: boolean;
  // Canada-specific college program types (shown only when Canada is selected)
  canada_college_types?: ("diploma" | "pg_diploma")[];
  // Scoring preference
  scholarship_seeking?: boolean;
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
  specialization: string;
  annual_tuition_usd: number;
  avg_living_cost_usd: number;
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
  work_exp_required_years: number | null;
  program_url: string;
  apply_url: string | null;
  is_active: boolean;
  last_updated: string;
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
  "Artificial Intelligence & Data Science",
  "Business & Management",
  "MBA",
  "Engineering (Mechanical/Civil/Electrical)",
  "Biotechnology & Life Sciences",
  "Medicine & Public Health",
  "Law",
  "Arts, Design & Architecture",
  "Social Sciences & Humanities",
  "Economics & Finance",
  "Media & Communications",
  "Environmental & Sustainability Studies",
  "Natural Sciences",
  "Nursing & Allied Health",
  "Agriculture & Veterinary Sciences",
  "Hospitality & Tourism",
] as const;

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
