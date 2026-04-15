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

// ─── Average starting salaries (USD equivalent) for fresh PGT graduates ──────
//
// All figures represent the MEDIAN starting salary for a Masters/postgraduate
// graduate at a mid-ranked (approx. QS 301-500) university in that country.
// A QS ranking premium (getRankingPremium in roi-calculator.ts) is multiplied
// on top: +35% QS≤10 (Oxford/Cambridge) down to +0% QS>500 (post-92/lower).
//
// Exchange rates applied (Apr 2025):
//   GBP×1.27 | AUD×0.65 | CAD×0.73 | EUR×1.08 |
//   SGD×0.74 | NZD×0.60 | AED×0.27 | MYR×0.22
//
// Sources by country:
//  USA        — NACE Summer 2024 Salary Survey (naceweb.org); BLS OES May 2024
//  UK         — HESA Graduate Outcomes 2022/23 PGT subject medians
//               (luminate.prospects.ac.uk); ISE Recruitment Survey 2024;
//               NHS Band 5 pay scale 2024/25; High Fliers Graduate Market 2024
//  Australia  — QILT Graduate Outcomes Survey 2024 (qilt.edu.au);
//               ACS IT Salary Survey 2024; Engineers Australia 2024
//  Canada     — Canada Job Bank 2024 NOC wages (jobbank.gc.ca);
//               Glassdoor Canada; Workopolis Salary Guide 2024
//  Germany    — Stepstone Gehaltsreport 2024; Bundesagentur Entgeltatlas 2024
//  Singapore  — MOE/MOM Joint Graduate Employment Survey 2023 (moe.gov.sg)
//  New Zealand— MBIE Occupation Outlook 2024; MECA pay rates 2024
//  Ireland    — HEA Graduate Outcomes Earnings Analysis 2022 (hea.ie);
//               GradIreland 2024 sector data
//  France     — APEC; Céreq Enquête Génération 2024; Glassdoor France 2024
//  UAE        — Bayt.com MENA Salary Survey 2024; GulfTalent 2024
//  Malaysia   — DOSM Graduate Statistics 2024; Jobstreet Malaysia 2024
//
export const SALARY_LOOKUP: Record<SalaryCountry, Record<FieldOfStudy, number>> = {
  // ── USA ── NACE Summer 2024 Salary Survey; BLS OES May 2024 (bls.gov)
  // All figures represent median starting salary for fresh Masters/postgrad
  // graduates at a mid-ranked (~QS 301-500) US institution. A ranking
  // premium is applied on top via getRankingPremium() in roi-calculator.ts.
  USA: {
    "Computer Science & IT":                       85000,  // NACE 2024 CS median; BLS 15-1252
    "Artificial Intelligence & Data Science":      92000,  // NACE ML/AI avg; Glassdoor entry DS $88-96K
    "Business & Management":                       66000,  // NACE Business median $62-70K
    "MBA":                                         77600,  // GMAC Corporate Recruiters 2024 mid-tier MBA
    "Economics & Finance":                         70000,  // BLS Financial Analysts 13-2051 entry
    "Engineering (Mechanical/Civil/Electrical)":   80500,  // NACE Eng. avg; BLS 17-2141/17-2051/17-2071
    "Medicine & Public Health":                    63600,  // AAMC MPH/DrPH entry; BLS 29-1221
    "Law":                                         77000,  // NALP JD class 2023 median (excl Big Law)
    "Nursing & Allied Health":                     66000,  // BLS RN 29-1141 entry-level new grad
    "Natural Sciences":                            69700,  // BLS Life/Physical Scientists 19-xxxx entry
    "Biotechnology & Life Sciences":               65000,  // BLS Biochemists 19-1021 / Biotech entry
    "Environmental & Sustainability Studies":      63000,  // BLS Environmental Scientists 19-2041
    "Social Sciences & Humanities":                55000,  // BLS Social Scientists; research roles
    "Arts, Design & Architecture":                 48000,  // BLS Architects 17-1011; Designers 27-1021
    "Media & Communications":                      62200,  // BLS PR/Media 27-3031 entry
    "Agriculture & Veterinary Sciences":           63100,  // BLS Ag Scientists 19-1011; Vet $67K entry
    "Hospitality & Tourism":                       50000,  // BLS Food Svc Managers 11-9051 entry
  },
  // UK figures are in USD (GBP × 1.27 per notes above).
  // Base figures reflect MEDIAN starting salary for Masters / PGT graduates
  // at a mid-tier (QS 301-500) UK university — i.e. the "no-premium" baseline.
  // A QS ranking premium is applied on top via getRankingPremium() in
  // roi-calculator.ts so that Oxford/Imperial numbers are appropriately higher
  // than a post-92 institution in the same field.
  //
  // Sources: HESA Graduate Outcomes 2022/23 (PGT subject medians via
  //   luminate.prospects.ac.uk); Glassdoor UK graduate role benchmarks;
  //   ISE Student Recruitment Survey 2024; NHS Band 5 pay scale 2024/25;
  //   High Fliers Graduate Market Report 2024.
  UK: {
    "Computer Science & IT":                       47000,  // £37 K — HESA CS / Glassdoor Grad SE median
    "Artificial Intelligence & Data Science":      49300,  // £38.8K — Glassdoor Grad Data Scientist + MSc premium
    "Business & Management":                       40600,  // £32 K — MSc Business / Management baseline
    "MBA":                                         73700,  // £58 K — Warwick/Imperial/Cranfield MBA median; High Fliers
    "Economics & Finance":                         50800,  // £40 K — MSc Finance median; ISE Finance & Prof Services
    "Engineering (Mechanical/Civil/Electrical)":   44500,  // £35 K — HESA Eng. first-degree + PGT premium
    "Medicine & Public Health":                    46800,  // £36.8K — blended MPH (£34 K) / NHS FY1 (£43.9 K)
    "Law":                                         44500,  // £35 K — blended LLM; City TC skew handled by ranking premium
    "Nursing & Allied Health":                     40700,  // £32 K — NHS Band 5 starting salary 2024/25 exact
    "Natural Sciences":                            36800,  // £29 K — HESA physical/natural sciences median
    "Biotechnology & Life Sciences":               38100,  // £30 K — biomed/biotech MSc entry
    "Environmental & Sustainability Studies":      35600,  // £28 K — HESA environmental/geography banding
    "Social Sciences & Humanities":                37000,  // £29.1K — HESA social sciences median
    "Arts, Design & Architecture":                 33000,  // £26 K — HESA design/architecture; fine arts lower
    "Media & Communications":                      34300,  // £27 K — HESA media / comms median
    "Agriculture & Veterinary Sciences":           34300,  // £27 K — agriculture/food sector entry
    "Hospitality & Tourism":                       33000,  // £26 K — hospitality entry level
  },
  // ── Australia ── QILT Graduate Outcomes Survey 2024 (qilt.edu.au); ACS IT Salary Survey 2024
  // AUD × 0.65. Base = mid-ranked Australian university PGT graduate.
  Australia: {
    "Computer Science & IT":                       48750,  // ACS 2024: CS grad ~AUD 75K entry median
    "Artificial Intelligence & Data Science":      55250,  // QILT PGT: DS/AI AUD 85K; SEEK entry range
    "Business & Management":                       45000,  // QILT PGT Business ~AUD 69K
    "MBA":                                         78000,  // Top AU MBA (Melb, AGSM) ~AUD 120K
    "Economics & Finance":                         47450,  // Finance analyst entry AUD 73K
    "Engineering (Mechanical/Civil/Electrical)":   55250,  // Engineers Australia 2024: new grad AUD 85K median
    "Medicine & Public Health":                    55300,  // QILT Health: MPH/PH AUD 85K
    "Law":                                         49400,  // Legal grad AUD 76K; varies city/firm
    "Nursing & Allied Health":                     46200,  // ANMF RN Band 2 base ~AUD 71K
    "Natural Sciences":                            44900,  // QILT Science PGT ~AUD 69K
    "Biotechnology & Life Sciences":               46800,  // Pharma/biotech entry AUD 72K
    "Environmental & Sustainability Studies":      46800,  // QILT Environment ~AUD 72K
    "Social Sciences & Humanities":                45700,  // QILT Social Sci ~AUD 70K
    "Arts, Design & Architecture":                 39000,  // Creative arts entry AUD 60K
    "Media & Communications":                      41600,  // Media entry AUD 64K
    "Agriculture & Veterinary Sciences":           46200,  // Ag/Vet entry AUD 71K
    "Hospitality & Tourism":                       42300,  // Hospitality mgt AUD 65K
  },
  // ── Canada ── Canada Job Bank 2023-24 NOC wages (jobbank.gc.ca); Glassdoor Canada
  // CAD × 0.73. Base = mid-ranked Canadian university PGT graduate.
  Canada: {
    "Computer Science & IT":                       53100,  // Glassdoor Canada new grad dev CAD 72-78K
    "Artificial Intelligence & Data Science":      58400,  // AI/ML Canada entry CAD 80K; hot market
    "Business & Management":                       38000,  // Business admin entry CAD 52K
    "MBA":                                         58400,  // Canadian MBA (Ivey/Rotman/Schulich) avg CAD 80K
    "Economics & Finance":                         41800,  // Finance analyst NOC 11101 CAD 57K
    "Engineering (Mechanical/Civil/Electrical)":   48600,  // Engineers Canada: new grad CAD 66-72K
    "Medicine & Public Health":                    50100,  // Public Health Canada: CAD 68-75K
    "Law":                                         45900,  // Articling associate CAD 63K avg
    "Nursing & Allied Health":                     45600,  // RN Canada entry CAD 62-68K
    "Natural Sciences":                            39500,  // Natural sciences NOC 21xxx entry CAD 54K
    "Biotechnology & Life Sciences":               43800,  // Pharma/biotech Canada entry CAD 60K
    "Environmental & Sustainability Studies":      39500,  // Environmental CAD 54K
    "Social Sciences & Humanities":                36400,  // Social worker/researcher CAD 50K
    "Arts, Design & Architecture":                 33400,  // Creative roles CAD 46K
    "Media & Communications":                      34900,  // Media/comms CAD 48K
    "Agriculture & Veterinary Sciences":           36400,  // Ag/Vet Canada CAD 50K
    "Hospitality & Tourism":                       33400,  // Hospitality mgt CAD 46K
  },
  // ── Germany ── Stepstone Gehaltsreport 2024; Bundesagentur für Arbeit Entgeltatlas
  // EUR × 1.08. Base = mid-ranked German/European university PGT graduate.
  Germany: {
    "Computer Science & IT":                       52300,  // Stepstone 2024: IT entry EUR 44-52K; Informatiker median
    "Artificial Intelligence & Data Science":      55100,  // AI/ML Germany entry EUR 48-56K; hot market
    "Business & Management":                       44800,  // BWL/Management entry EUR 40-48K
    "MBA":                                         64800,  // German MBA (Mannheim, WHU, ESMT) EUR 55-70K avg
    "Economics & Finance":                         44800,  // Finance/Economics entry EUR 41-50K
    "Engineering (Mechanical/Civil/Electrical)":   51800,  // Engineering entry EUR 46-52K; Stepstone Ingenieur
    "Medicine & Public Health":                    59400,  // Resident doctor (Assistenzarzt) EUR 52-60K
    "Law":                                         51800,  // Rechtsanwalt entry EUR 44-52K; Referendar lower
    "Nursing & Allied Health":                     37800,  // Krankenschwester entry EUR 28-38K
    "Natural Sciences":                            43600,  // Natural sciences PhD/MSc entry EUR 38-44K
    "Biotechnology & Life Sciences":               47200,  // Pharma/biotech Germany EUR 42-50K
    "Environmental & Sustainability Studies":      44300,  // Environmental eng/science EUR 38-46K
    "Social Sciences & Humanities":                40900,  // Social sci/Sozialwiss EUR 34-44K
    "Arts, Design & Architecture":                 36800,  // Design/Architektur entry EUR 32-38K
    "Media & Communications":                      37400,  // Media/Komm EUR 30-40K
    "Agriculture & Veterinary Sciences":           38200,  // Agrar/Vet EUR 32-40K
    "Hospitality & Tourism":                       36700,  // Hospitality entry EUR 30-38K
  },
  // ── Singapore ── MOE/MOM Joint Graduate Employment Survey 2023 (moe.gov.sg)
  // SGD × 0.74. NUS/NTU/SMU fresh grad median monthly gross used as baseline.
  Singapore: {
    "Computer Science & IT":                       48800,  // MOE 2023: CS/IT SGD 5,500/month = $66K; mid-tier lower
    "Artificial Intelligence & Data Science":      50300,  // AI/DS SGD 5,700/month; demand premium
    "Business & Management":                       39960,  // MOE Business median SGD 4,500/month = $54K
    "MBA":                                         48800,  // NUS/NTU MBA SGD 60-90K; mid-tier ~SGD 66K
    "Economics & Finance":                         39960,  // MOE Economics SGD 4,500/month
    "Engineering (Mechanical/Civil/Electrical)":   40000,  // MOE Engineering SGD 4,500-5,000/month
    "Medicine & Public Health":                    40400,  // MOE Medicine/Nursing entry
    "Law":                                         62200,  // Singapore law associate SGD 7,000+/month
    "Nursing & Allied Health":                     37000,  // MOE Nursing SGD 4,200/month baseline
    "Natural Sciences":                            35500,  // MOE Science SGD 4,000/month
    "Biotechnology & Life Sciences":               35500,  // MOE Life Sciences SGD 4,000/month
    "Environmental & Sustainability Studies":      35500,  // Environmental roles SGD 4,000/month
    "Social Sciences & Humanities":                35700,  // MOE Arts/SS SGD 4,050/month
    "Arts, Design & Architecture":                 33200,  // Design/Architecture entry
    "Media & Communications":                      33200,  // Media entry
    "Agriculture & Veterinary Sciences":           35500,  // Agri-food/vet entry
    "Hospitality & Tourism":                       31100,  // Hospitality entry SGD 3,500/month
  },
  // ── New Zealand ── MBIE Occupation Outlook 2024 (occupationoutlook.mbie.govt.nz)
  // NZD × 0.60. Base = mid-ranked NZ university PGT graduate.
  "New Zealand": {
    "Computer Science & IT":                       39000,  // MBIE IT median NZD 65K entry
    "Artificial Intelligence & Data Science":      40800,  // DS/AI entry NZD 68K
    "Business & Management":                       33000,  // Business entry NZD 55K
    "MBA":                                         43200,  // NZ MBA NZD 70-80K avg; mid-tier NZD 72K
    "Economics & Finance":                         33600,  // Finance entry NZD 56K
    "Engineering (Mechanical/Civil/Electrical)":   39000,  // Engineers NZ 2024: new grad NZD 65K
    "Medicine & Public Health":                    48000,  // NZ House Officer NZD 80K (MECA rate 2024)
    "Law":                                         36000,  // NZ law grad NZD 60K
    "Nursing & Allied Health":                     33000,  // NZ RN entry NZD 55K (NZNO Band 2)
    "Natural Sciences":                            31200,  // Natural sciences NZD 52K
    "Biotechnology & Life Sciences":               33000,  // Biotech/pharma entry NZD 55K
    "Environmental & Sustainability Studies":      30600,  // Environmental science NZD 51K
    "Social Sciences & Humanities":                30000,  // Social work/research NZD 50K
    "Arts, Design & Architecture":                 28800,  // Design entry NZD 48K
    "Media & Communications":                      30000,  // Media NZD 50K
    "Agriculture & Veterinary Sciences":           29400,  // Ag/Vet NZD 49K
    "Hospitality & Tourism":                       28800,  // Hospitality NZD 48K
  },
  // ── Ireland ── HEA Graduate Outcomes Earnings Analysis 2022; GradIreland 2024
  // EUR × 1.08. Ireland is a major pharma/tech hub — biotech/CS skew upwards.
  Ireland: {
    "Computer Science & IT":                       43300,  // GradIreland 2024: tech entry EUR 38-48K
    "Artificial Intelligence & Data Science":      45400,  // AI/ML Dublin tech firms EUR 40-55K
    "Business & Management":                       32400,  // Business entry EUR 28-36K; revised up
    "MBA":                                         54000,  // Smurfit/DCU MBA EUR 48-60K
    "Economics & Finance":                         32400,  // Finance entry EUR 30-40K
    "Engineering (Mechanical/Civil/Electrical)":   37800,  // Eng. Ireland EUR 34-44K
    "Medicine & Public Health":                    51700,  // Public Health Officer EUR 45-55K
    "Law":                                         37800,  // Solicitor entry EUR 32-50K
    "Nursing & Allied Health":                     30200,  // HSE RN Band 5 EUR 28-32K
    "Natural Sciences":                            37500,  // Science roles EUR 32-42K
    "Biotechnology & Life Sciences":               43200,  // Pharma MNCs (Pfizer/J&J/Lilly) EUR 38-48K
    "Environmental & Sustainability Studies":      34600,  // Environmental roles EUR 30-38K
    "Social Sciences & Humanities":                29300,  // Social sci/NGO EUR 26-32K
    "Arts, Design & Architecture":                 25900,  // Creative entry EUR 22-28K
    "Media & Communications":                      28100,  // Media EUR 24-32K
    "Agriculture & Veterinary Sciences":           30200,  // Ag/Food Ireland EUR 27-34K
    "Hospitality & Tourism":                       27000,  // Hospitality EUR 23-30K
  },
  // ── France ── APEC; Céreq Enquête Génération; Glassdoor France
  // EUR × 1.08. Grande École graduates at top tier earn significantly more
  // (handled by ranking premium). Base = post-Masters non-Grande-École entry.
  France: {
    "Computer Science & IT":                       48600,  // Glassdoor France software entry EUR 42-52K
    "Artificial Intelligence & Data Science":      50400,  // AI/ML Paris EUR 44-58K; demand premium
    "Business & Management":                       36700,  // Business/Gestion entry EUR 32-42K
    "MBA":                                         59400,  // French MBA (mid-tier) EUR 48-62K; HEC/INSEAD premium via ranking
    "Economics & Finance":                         41000,  // Finance entry EUR 36-48K
    "Engineering (Mechanical/Civil/Electrical)":   40600,  // Ingénieur Bac+5 EUR 36-44K
    "Medicine & Public Health":                    41000,  // MPH/Santé publique EUR 34-44K
    "Law":                                         32400,  // Avocat entry EUR 28-36K
    "Nursing & Allied Health":                     30200,  // Infirmier public sector EUR 22-30K
    "Natural Sciences":                            34600,  // Sciences entry EUR 30-38K
    "Biotechnology & Life Sciences":               34600,  // Pharma/biotech France EUR 30-40K
    "Environmental & Sustainability Studies":      32400,  // Environmental roles EUR 28-36K
    "Social Sciences & Humanities":                30200,  // Sciences humaines EUR 25-34K
    "Arts, Design & Architecture":                 28100,  // Design/Archi entry EUR 24-32K
    "Media & Communications":                      30200,  // Media/Comm EUR 26-34K
    "Agriculture & Veterinary Sciences":           30200,  // Agri/Vet France EUR 26-34K
    "Hospitality & Tourism":                       32400,  // Hospitality/Tourism EUR 28-36K
  },
  // ── UAE ── Bayt.com MENA Salary Survey 2024; GulfTalent 2024; UAEExpertHub
  // AED × 0.27. Tax-free salaries; figures are gross (no income tax in UAE).
  UAE: {
    "Computer Science & IT":                       40500,  // UAE tech entry AED 130-180K; mid-tier AED 150K
    "Artificial Intelligence & Data Science":      43200,  // AI/ML UAE AED 140-200K; strong demand AED 160K
    "Business & Management":                       32400,  // Business entry AED 100-150K; mid AED 120K
    "MBA":                                         51300,  // UAE MBA AED 160-240K; mid AED 190K
    "Economics & Finance":                         38900,  // Finance/banking UAE AED 130-160K
    "Engineering (Mechanical/Civil/Electrical)":   38900,  // Engineering UAE AED 130-160K
    "Medicine & Public Health":                    54000,  // UAE doctor entry AED 180-220K; specialist more
    "Law":                                         32400,  // UAE lawyer AED 100-200K; mid AED 120K
    "Nursing & Allied Health":                     27000,  // UAE RN AED 84-120K; mid AED 100K
    "Natural Sciences":                            29200,  // Natural sciences UAE AED 100-120K
    "Biotechnology & Life Sciences":               32400,  // Pharma/biotech UAE AED 110-140K
    "Environmental & Sustainability Studies":      27500,  // Environmental roles AED 90-120K
    "Social Sciences & Humanities":                25900,  // Social sci UAE AED 84-108K
    "Arts, Design & Architecture":                 22700,  // Design/Arch UAE AED 72-96K
    "Media & Communications":                      24300,  // Media/Comms UAE AED 84-108K
    "Agriculture & Veterinary Sciences":           22700,  // Ag/Vet UAE (niche) AED 72-96K
    "Hospitality & Tourism":                       22700,  // Hospitality AED 72-96K; tips supplement
  },
  // ── Malaysia ── DOSM Graduate Statistics 2024; Jobstreet Malaysia Salary Report 2024
  // MYR × 0.22. Figures represent fresh PGT graduate entry salaries.
  Malaysia: {
    "Computer Science & IT":                       13200,  // Jobstreet 2024: CS grad MYR 4,500-5,500/month; mid MYR 60K
    "Artificial Intelligence & Data Science":      15400,  // AI/ML Malaysia MYR 5,000-7,000/month; hot market MYR 70K
    "Business & Management":                       10000,  // Business entry MYR 3,000-4,000/month; MYR 45K
    "MBA":                                         15400,  // Malaysian MBA MYR 5,500-7,500/month; MYR 70K
    "Economics & Finance":                          9900,  // Finance analyst MYR 3,500-4,500/month; MYR 45K
    "Engineering (Mechanical/Civil/Electrical)":   11400,  // Engineering entry MYR 3,500-5,000/month; MYR 52K
    "Medicine & Public Health":                    17200,  // HO doctor MYR 4,845/month base + allowances ~MYR 78K
    "Law":                                          7700,  // Chambering pupil MYR 2,000-4,000/month; MYR 35K
    "Nursing & Allied Health":                      8400,  // Nurse Malaysia MYR 2,500-4,000/month; MYR 38K
    "Natural Sciences":                             8400,  // Natural sciences entry MYR 2,800-3,800/month
    "Biotechnology & Life Sciences":                9900,  // Pharma/biotech Malaysia MYR 3,500-4,500/month
    "Environmental & Sustainability Studies":       7900,  // Environmental entry MYR 2,800-3,600/month
    "Social Sciences & Humanities":                 7400,  // Social sci/NGO MYR 2,500-3,500/month
    "Arts, Design & Architecture":                  7700,  // Design/Arch entry MYR 2,800-3,800/month
    "Media & Communications":                       7400,  // Media/Comms entry MYR 2,500-3,500/month
    "Agriculture & Veterinary Sciences":            6600,  // Ag/Vet Malaysia MYR 2,200-3,200/month
    "Hospitality & Tourism":                        6600,  // Hospitality entry MYR 2,200-3,200/month
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
