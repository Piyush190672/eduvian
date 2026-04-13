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

// Average starting salaries (USD equivalent) for international grads, major cities.
// Sources: LinkedIn Salary, NACE, Glassdoor, PayScale, Graduate Outcomes Survey 2023-25.
export const SALARY_LOOKUP: Record<SalaryCountry, Record<FieldOfStudy, number>> = {
  USA: {
    "Computer Science & IT":                      115000,
    "Artificial Intelligence & Data Science":     125000,
    "Business & Management":                       72000,
    "MBA":                                         115000,
    "Economics & Finance":                          88000,
    "Engineering (Mechanical/Civil/Electrical)":    82000,
    "Medicine & Public Health":                     70000,
    "Law":                                          80000,
    "Nursing & Allied Health":                      68000,
    "Natural Sciences":                             58000,
    "Biotechnology & Life Sciences":                72000,
    "Environmental & Sustainability Studies":       60000,
    "Social Sciences & Humanities":                 50000,
    "Arts, Design & Architecture":                  52000,
    "Media & Communications":                       52000,
    "Agriculture & Veterinary Sciences":            50000,
    "Hospitality & Tourism":                        48000,
  },
  UK: {
    "Computer Science & IT":                        55000,
    "Artificial Intelligence & Data Science":       62000,
    "Business & Management":                        42000,
    "MBA":                                          68000,
    "Economics & Finance":                          55000,
    "Engineering (Mechanical/Civil/Electrical)":    44000,
    "Medicine & Public Health":                     42000,
    "Law":                                          48000,
    "Nursing & Allied Health":                      36000,
    "Natural Sciences":                             36000,
    "Biotechnology & Life Sciences":                40000,
    "Environmental & Sustainability Studies":       34000,
    "Social Sciences & Humanities":                 32000,
    "Arts, Design & Architecture":                  32000,
    "Media & Communications":                       32000,
    "Agriculture & Veterinary Sciences":            30000,
    "Hospitality & Tourism":                        28000,
  },
  Australia: {
    "Computer Science & IT":                        72000,
    "Artificial Intelligence & Data Science":       80000,
    "Business & Management":                        58000,
    "MBA":                                          88000,
    "Economics & Finance":                          66000,
    "Engineering (Mechanical/Civil/Electrical)":    68000,
    "Medicine & Public Health":                     60000,
    "Law":                                          62000,
    "Nursing & Allied Health":                      58000,
    "Natural Sciences":                             52000,
    "Biotechnology & Life Sciences":                56000,
    "Environmental & Sustainability Studies":       52000,
    "Social Sciences & Humanities":                 46000,
    "Arts, Design & Architecture":                  46000,
    "Media & Communications":                       46000,
    "Agriculture & Veterinary Sciences":            48000,
    "Hospitality & Tourism":                        42000,
  },
  Canada: {
    "Computer Science & IT":                        72000,
    "Artificial Intelligence & Data Science":       80000,
    "Business & Management":                        55000,
    "MBA":                                          82000,
    "Economics & Finance":                          60000,
    "Engineering (Mechanical/Civil/Electrical)":    62000,
    "Medicine & Public Health":                     58000,
    "Law":                                          58000,
    "Nursing & Allied Health":                      54000,
    "Natural Sciences":                             48000,
    "Biotechnology & Life Sciences":                52000,
    "Environmental & Sustainability Studies":       48000,
    "Social Sciences & Humanities":                 42000,
    "Arts, Design & Architecture":                  42000,
    "Media & Communications":                       42000,
    "Agriculture & Veterinary Sciences":            44000,
    "Hospitality & Tourism":                        38000,
  },
  Germany: {
    "Computer Science & IT":                        58000,
    "Artificial Intelligence & Data Science":       65000,
    "Business & Management":                        48000,
    "MBA":                                          70000,
    "Economics & Finance":                          54000,
    "Engineering (Mechanical/Civil/Electrical)":    56000,
    "Medicine & Public Health":                     52000,
    "Law":                                          46000,
    "Nursing & Allied Health":                      36000,
    "Natural Sciences":                             44000,
    "Biotechnology & Life Sciences":                48000,
    "Environmental & Sustainability Studies":       42000,
    "Social Sciences & Humanities":                 36000,
    "Arts, Design & Architecture":                  36000,
    "Media & Communications":                       36000,
    "Agriculture & Veterinary Sciences":            38000,
    "Hospitality & Tourism":                        30000,
  },
  Singapore: {
    "Computer Science & IT":                        62000,
    "Artificial Intelligence & Data Science":       72000,
    "Business & Management":                        52000,
    "MBA":                                          90000,
    "Economics & Finance":                          60000,
    "Engineering (Mechanical/Civil/Electrical)":    54000,
    "Medicine & Public Health":                     52000,
    "Law":                                          56000,
    "Nursing & Allied Health":                      40000,
    "Natural Sciences":                             44000,
    "Biotechnology & Life Sciences":                50000,
    "Environmental & Sustainability Studies":       42000,
    "Social Sciences & Humanities":                 38000,
    "Arts, Design & Architecture":                  38000,
    "Media & Communications":                       38000,
    "Agriculture & Veterinary Sciences":            36000,
    "Hospitality & Tourism":                        36000,
  },
  "New Zealand": {
    "Computer Science & IT":                        56000,
    "Artificial Intelligence & Data Science":       62000,
    "Business & Management":                        46000,
    "MBA":                                          68000,
    "Economics & Finance":                          50000,
    "Engineering (Mechanical/Civil/Electrical)":    54000,
    "Medicine & Public Health":                     52000,
    "Law":                                          48000,
    "Nursing & Allied Health":                      48000,
    "Natural Sciences":                             42000,
    "Biotechnology & Life Sciences":                46000,
    "Environmental & Sustainability Studies":       42000,
    "Social Sciences & Humanities":                 38000,
    "Arts, Design & Architecture":                  36000,
    "Media & Communications":                       36000,
    "Agriculture & Veterinary Sciences":            40000,
    "Hospitality & Tourism":                        32000,
  },
  Ireland: {
    "Computer Science & IT":                        58000,
    "Artificial Intelligence & Data Science":       66000,
    "Business & Management":                        46000,
    "MBA":                                          72000,
    "Economics & Finance":                          52000,
    "Engineering (Mechanical/Civil/Electrical)":    50000,
    "Medicine & Public Health":                     50000,
    "Law":                                          46000,
    "Nursing & Allied Health":                      40000,
    "Natural Sciences":                             40000,
    "Biotechnology & Life Sciences":                48000,
    "Environmental & Sustainability Studies":       38000,
    "Social Sciences & Humanities":                 34000,
    "Arts, Design & Architecture":                  34000,
    "Media & Communications":                       34000,
    "Agriculture & Veterinary Sciences":            36000,
    "Hospitality & Tourism":                        30000,
  },
  France: {
    "Computer Science & IT":                        50000,
    "Artificial Intelligence & Data Science":       58000,
    "Business & Management":                        44000,
    "MBA":                                          72000,
    "Economics & Finance":                          50000,
    "Engineering (Mechanical/Civil/Electrical)":    48000,
    "Medicine & Public Health":                     44000,
    "Law":                                          40000,
    "Nursing & Allied Health":                      32000,
    "Natural Sciences":                             36000,
    "Biotechnology & Life Sciences":                42000,
    "Environmental & Sustainability Studies":       36000,
    "Social Sciences & Humanities":                 32000,
    "Arts, Design & Architecture":                  34000,
    "Media & Communications":                       32000,
    "Agriculture & Veterinary Sciences":            32000,
    "Hospitality & Tourism":                        30000,
  },
  UAE: {
    "Computer Science & IT":                        62000,
    "Artificial Intelligence & Data Science":       72000,
    "Business & Management":                        52000,
    "MBA":                                          85000,
    "Economics & Finance":                          64000,
    "Engineering (Mechanical/Civil/Electrical)":    58000,
    "Medicine & Public Health":                     60000,
    "Law":                                          54000,
    "Nursing & Allied Health":                      38000,
    "Natural Sciences":                             40000,
    "Biotechnology & Life Sciences":                44000,
    "Environmental & Sustainability Studies":       40000,
    "Social Sciences & Humanities":                 34000,
    "Arts, Design & Architecture":                  38000,
    "Media & Communications":                       36000,
    "Agriculture & Veterinary Sciences":            32000,
    "Hospitality & Tourism":                        34000,
  },
  Malaysia: {
    "Computer Science & IT":                        18000,
    "Artificial Intelligence & Data Science":       22000,
    "Business & Management":                        14000,
    "MBA":                                          22000,
    "Economics & Finance":                          16000,
    "Engineering (Mechanical/Civil/Electrical)":    16000,
    "Medicine & Public Health":                     18000,
    "Law":                                          14000,
    "Nursing & Allied Health":                      12000,
    "Natural Sciences":                             12000,
    "Biotechnology & Life Sciences":                14000,
    "Environmental & Sustainability Studies":       12000,
    "Social Sciences & Humanities":                 11000,
    "Arts, Design & Architecture":                  12000,
    "Media & Communications":                       11000,
    "Agriculture & Veterinary Sciences":            11000,
    "Hospitality & Tourism":                        10000,
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
