// ─── ROI Calculator Data ──────────────────────────────────────────────────────
import { PROGRAMS } from "./programs";

export type SalaryCountry =
  | "USA" | "UK" | "Australia" | "Canada" | "Germany"
  | "Singapore" | "New Zealand" | "Ireland" | "France" | "UAE" | "Malaysia";

export type FieldOfStudy =
  | "Computer Science & IT"
  | "Artificial Intelligence & Data Science"
  | "Business & Management"
  | "MBA"
  | "Economics & Finance"
  | "Engineering (Mechanical/Civil/Electrical)"
  | "Medicine & Public Health"
  | "Law"
  | "Nursing & Allied Health"
  | "Natural Sciences"
  | "Biotechnology & Life Sciences"
  | "Environmental & Sustainability Studies"
  | "Social Sciences & Humanities"
  | "Arts, Design & Architecture"
  | "Media & Communications"
  | "Agriculture & Veterinary Sciences"
  | "Hospitality & Tourism";

// ─── Average starting salaries (USD equivalent) for fresh graduates ───────────
//
// All figures are sourced from official government surveys and authoritative
// salary databases. Conservative / lower-bound values are used throughout.
// Exchange rates applied: GBP×1.27 | AUD×0.65 | CAD×0.73 | EUR×1.08 |
//   SGD×0.74 | NZD×0.60 | AED×0.27 | MYR×0.22
//
// Sources by country:
//  USA        — NACE Summer 2024 Salary Survey (naceweb.org); BLS OES May 2024
//  UK         — HESA Graduate Outcomes Survey 2022/23 via Prospects Luminate
//               (luminate.prospects.ac.uk); NHS Band 5 for Nursing
//  Australia  — QILT Graduate Outcomes Survey 2024 (qilt.edu.au)
//  Canada     — Canada Job Bank 2023-24 low-band hourly wages (jobbank.gc.ca)
//  Germany    — Stepstone Gehaltsreport 2024 / karrierebibel.de; expatrio.com
//  Singapore  — MOE/MOM Joint Graduate Employment Survey 2023 (moe.gov.sg)
//  New Zealand— MBIE Occupation Outlook 2024 (occupationoutlook.mbie.govt.nz)
//  Ireland    — HEA Graduate Outcomes Earnings Analysis 2021 (hea.ie);
//               GradIreland 2023 sector data
//  France     — APEC / Céreq Enquête Génération (secondary via berlinsbi.com)
//  UAE        — Bayt.com MENA Salary Survey 2023; UAEExpertHub Dubai 2024
//  Malaysia   — DOSM Graduate Statistics 2024; Jobstreet Malaysia / EasyUni 2024
//
export const SALARY_LOOKUP: Record<SalaryCountry, Record<FieldOfStudy, number>> = {
  USA: {
    "Computer Science & IT":                       88900,
    "Artificial Intelligence & Data Science":      95000,
    "Business & Management":                       68600,
    "MBA":                                         77600,
    "Economics & Finance":                         70000,
    "Engineering (Mechanical/Civil/Electrical)":   80500,
    "Medicine & Public Health":                    63600,
    "Law":                                         77000,
    "Nursing & Allied Health":                     60000,
    "Natural Sciences":                            69700,
    "Biotechnology & Life Sciences":               65000,
    "Environmental & Sustainability Studies":      63000,
    "Social Sciences & Humanities":                55000,
    "Arts, Design & Architecture":                 48000,
    "Media & Communications":                      62200,
    "Agriculture & Veterinary Sciences":           63100,
    "Hospitality & Tourism":                       50000,
  },
  UK: {
    "Computer Science & IT":                       37000,
    "Artificial Intelligence & Data Science":      38100,
    "Business & Management":                       38300,
    "MBA":                                         50800,
    "Economics & Finance":                         38700,
    "Engineering (Mechanical/Civil/Electrical)":   40400,
    "Medicine & Public Health":                    48200,
    "Law":                                         35200,
    "Nursing & Allied Health":                     39400,
    "Natural Sciences":                            34900,
    "Biotechnology & Life Sciences":               34900,
    "Environmental & Sustainability Studies":      34300,
    "Social Sciences & Humanities":                34500,
    "Arts, Design & Architecture":                 30300,
    "Media & Communications":                      31700,
    "Agriculture & Veterinary Sciences":           32400,
    "Hospitality & Tourism":                       30500,
  },
  Australia: {
    "Computer Science & IT":                       48400,
    "Artificial Intelligence & Data Science":      48400,
    "Business & Management":                       45000,
    "MBA":                                         78000,
    "Economics & Finance":                         45000,
    "Engineering (Mechanical/Civil/Electrical)":   52000,
    "Medicine & Public Health":                    55300,
    "Law":                                         49400,
    "Nursing & Allied Health":                     46200,
    "Natural Sciences":                            44900,
    "Biotechnology & Life Sciences":               44900,
    "Environmental & Sustainability Studies":      46800,
    "Social Sciences & Humanities":                45700,
    "Arts, Design & Architecture":                 39000,
    "Media & Communications":                      41600,
    "Agriculture & Veterinary Sciences":           46200,
    "Hospitality & Tourism":                       42300,
  },
  Canada: {
    "Computer Science & IT":                       53100,
    "Artificial Intelligence & Data Science":      56200,
    "Business & Management":                       38000,
    "MBA":                                         46600,
    "Economics & Finance":                         41800,
    "Engineering (Mechanical/Civil/Electrical)":   48600,
    "Medicine & Public Health":                    50100,
    "Law":                                         45900,
    "Nursing & Allied Health":                     45600,
    "Natural Sciences":                            39500,
    "Biotechnology & Life Sciences":               39500,
    "Environmental & Sustainability Studies":      39500,
    "Social Sciences & Humanities":                36400,
    "Arts, Design & Architecture":                 33400,
    "Media & Communications":                      34900,
    "Agriculture & Veterinary Sciences":           36400,
    "Hospitality & Tourism":                       33400,
  },
  Germany: {
    "Computer Science & IT":                       55100,
    "Artificial Intelligence & Data Science":      55100,
    "Business & Management":                       44800,
    "MBA":                                         50700,
    "Economics & Finance":                         44800,
    "Engineering (Mechanical/Civil/Electrical)":   50000,
    "Medicine & Public Health":                    64200,
    "Law":                                         56500,
    "Nursing & Allied Health":                     37800,
    "Natural Sciences":                            43600,
    "Biotechnology & Life Sciences":               47200,
    "Environmental & Sustainability Studies":      44300,
    "Social Sciences & Humanities":                40900,
    "Arts, Design & Architecture":                 36800,
    "Media & Communications":                      37400,
    "Agriculture & Veterinary Sciences":           38200,
    "Hospitality & Tourism":                       36700,
  },
  Singapore: {
    "Computer Science & IT":                       48800,
    "Artificial Intelligence & Data Science":      48800,
    "Business & Management":                       36900,
    "MBA":                                         48800,
    "Economics & Finance":                         36900,
    "Engineering (Mechanical/Civil/Electrical)":   40000,
    "Medicine & Public Health":                    40400,
    "Law":                                         62200,
    "Nursing & Allied Health":                     34700,
    "Natural Sciences":                            35500,
    "Biotechnology & Life Sciences":               35500,
    "Environmental & Sustainability Studies":      35500,
    "Social Sciences & Humanities":                35700,
    "Arts, Design & Architecture":                 33200,
    "Media & Communications":                      33200,
    "Agriculture & Veterinary Sciences":           35500,
    "Hospitality & Tourism":                       31100,
  },
  "New Zealand": {
    "Computer Science & IT":                       39000,
    "Artificial Intelligence & Data Science":      40800,
    "Business & Management":                       33000,
    "MBA":                                         42000,
    "Economics & Finance":                         33600,
    "Engineering (Mechanical/Civil/Electrical)":   36000,
    "Medicine & Public Health":                    42000,
    "Law":                                         36000,
    "Nursing & Allied Health":                     31500,
    "Natural Sciences":                            31200,
    "Biotechnology & Life Sciences":               31200,
    "Environmental & Sustainability Studies":      30000,
    "Social Sciences & Humanities":                30000,
    "Arts, Design & Architecture":                 28800,
    "Media & Communications":                      30000,
    "Agriculture & Veterinary Sciences":           28800,
    "Hospitality & Tourism":                       28800,
  },
  Ireland: {
    "Computer Science & IT":                       43300,
    "Artificial Intelligence & Data Science":      45400,
    "Business & Management":                       30200,
    "MBA":                                         54000,
    "Economics & Finance":                         32400,
    "Engineering (Mechanical/Civil/Electrical)":   37800,
    "Medicine & Public Health":                    51700,
    "Law":                                         37800,
    "Nursing & Allied Health":                     30200,
    "Natural Sciences":                            37500,
    "Biotechnology & Life Sciences":               37500,
    "Environmental & Sustainability Studies":      34600,
    "Social Sciences & Humanities":                29300,
    "Arts, Design & Architecture":                 25900,
    "Media & Communications":                      28100,
    "Agriculture & Veterinary Sciences":           30200,
    "Hospitality & Tourism":                       27000,
  },
  France: {
    "Computer Science & IT":                       48600,
    "Artificial Intelligence & Data Science":      48600,
    "Business & Management":                       36700,
    "MBA":                                         48600,
    "Economics & Finance":                         41000,
    "Engineering (Mechanical/Civil/Electrical)":   40600,
    "Medicine & Public Health":                    41000,
    "Law":                                         32400,
    "Nursing & Allied Health":                     30200,
    "Natural Sciences":                            34600,
    "Biotechnology & Life Sciences":               34600,
    "Environmental & Sustainability Studies":      32400,
    "Social Sciences & Humanities":                30200,
    "Arts, Design & Architecture":                 28100,
    "Media & Communications":                      30200,
    "Agriculture & Veterinary Sciences":           30200,
    "Hospitality & Tourism":                       32400,
  },
  UAE: {
    "Computer Science & IT":                       38900,
    "Artificial Intelligence & Data Science":      38900,
    "Business & Management":                       32400,
    "MBA":                                         48600,
    "Economics & Finance":                         38900,
    "Engineering (Mechanical/Civil/Electrical)":   38900,
    "Medicine & Public Health":                    48600,
    "Law":                                         32400,
    "Nursing & Allied Health":                     25900,
    "Natural Sciences":                            29200,
    "Biotechnology & Life Sciences":               29200,
    "Environmental & Sustainability Studies":      27500,
    "Social Sciences & Humanities":                25900,
    "Arts, Design & Architecture":                 22700,
    "Media & Communications":                      24300,
    "Agriculture & Veterinary Sciences":           22700,
    "Hospitality & Tourism":                       22700,
  },
  Malaysia: {
    "Computer Science & IT":                       11900,
    "Artificial Intelligence & Data Science":      15200,
    "Business & Management":                       10000,
    "MBA":                                         13200,
    "Economics & Finance":                          9200,
    "Engineering (Mechanical/Civil/Electrical)":   11400,
    "Medicine & Public Health":                    17200,
    "Law":                                          7400,
    "Nursing & Allied Health":                      8400,
    "Natural Sciences":                             8400,
    "Biotechnology & Life Sciences":                9200,
    "Environmental & Sustainability Studies":       7900,
    "Social Sciences & Humanities":                 7400,
    "Arts, Design & Architecture":                  7400,
    "Media & Communications":                       7400,
    "Agriculture & Veterinary Sciences":            6600,
    "Hospitality & Tourism":                        6600,
  },
};

export interface UniversityOption {
  name: string;
  country: SalaryCountry;
  qs_ranking: number | null;
  flag: string;
}

const FLAGS: Record<SalaryCountry, string> = {
  USA: "🇺🇸", UK: "🇬🇧", Australia: "🇦🇺", Canada: "🇨🇦",
  Germany: "🇩🇪", Singapore: "🇸🇬", "New Zealand": "🇳🇿", Ireland: "🇮🇪",
  France: "🇫🇷", UAE: "🇦🇪", Malaysia: "🇲🇾",
};

// ── Dynamically build CURATED_UNIVERSITIES from the live PROGRAMS database ──
// This means every university added to programs.ts automatically appears in
// the typeahead for both the ROI Calculator and Parent Decision Tool.

const _seen = new Map<string, UniversityOption>();

for (const p of PROGRAMS) {
  if (!p || !p.university_name) continue;
  const country = p.country as SalaryCountry;
  if (!FLAGS[country]) continue; // skip unknown/unsupported countries
  const key = p.university_name;
  if (!_seen.has(key)) {
    _seen.set(key, {
      name: p.university_name,
      country,
      qs_ranking: p.qs_ranking ?? null,
      flag: FLAGS[country],
    });
  } else if (!_seen.get(key)!.qs_ranking && p.qs_ranking) {
    // upgrade to a non-null QS ranking if we find one
    _seen.get(key)!.qs_ranking = p.qs_ranking;
  }
}

export const CURATED_UNIVERSITIES: UniversityOption[] = [..._seen.values()].sort(
  (a, b) => {
    // ranked universities first (ascending), unranked last, then alpha
    if (a.qs_ranking && b.qs_ranking) return a.qs_ranking - b.qs_ranking;
    if (a.qs_ranking) return -1;
    if (b.qs_ranking) return 1;
    return a.name.localeCompare(b.name);
  }
);

export const COUNTRY_FLAGS = FLAGS;
