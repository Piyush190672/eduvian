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
// on top. University-specific overrides (UNIVERSITY_SALARY_OVERRIDES below)
// take precedence for named elite institutions.
//
// Exchange rates applied (Apr 2025 — refreshed from XE.com):
//   GBP×1.27 | AUD×0.65 | CAD×0.73 | EUR×1.08 |
//   SGD×0.74 | NZD×0.60 | AED×0.27 | MYR×0.22
//
// Sources by country:
//  USA        — NACE Spring 2024 Salary Survey; BLS OES May 2024; GMAC
//               Corporate Recruiters Survey 2024; NALP JD employment 2023
//  UK         — HESA Graduate Outcomes 2022/23 (luminate.prospects.ac.uk);
//               ISE Recruitment Survey 2024; NHS Band 5 2024/25;
//               High Fliers Graduate Market 2024
//  Australia  — QILT Graduate Outcomes Survey 2024; ACS IT Salary Survey 2024;
//               Engineers Australia Remuneration Survey 2024
//  Canada     — Canada Job Bank 2024 NOC wages; Glassdoor Canada 2024;
//               Workopolis Salary Guide 2024
//  Germany    — Stepstone Gehaltsreport 2024; Bundesagentur Entgeltatlas 2024
//  Singapore  — MOE/MOM GES 2023 (moe.gov.sg); base calibrated to mid-tier SG
//               institutions (NUS/NTU overridden separately)
//  New Zealand— MBIE Occupation Outlook 2024; MECA pay rates 2024
//  Ireland    — HEA Graduate Outcomes Earnings 2022; GradIreland 2024
//  France     — APEC; Céreq Enquête Génération 2024; Glassdoor France 2024
//  UAE        — Bayt.com MENA Salary Survey 2024; GulfTalent 2024
//  Malaysia   — DOSM Graduate Statistics 2024; Jobstreet Malaysia 2024
//
export const SALARY_LOOKUP: Record<SalaryCountry, Record<FieldOfStudy, number>> = {
  // ── USA ── NACE Spring 2024 Salary Survey; BLS OES May 2024 (bls.gov)
  // Base = median starting salary for fresh MS/postgrad graduates at a
  // mid-ranked (~QS 301-500) US institution. Ranking premium applied on top.
  // Elite university-specific values are in UNIVERSITY_SALARY_OVERRIDES below.
  USA: {
    "Computer Science & IT":                       92000,  // NACE 2024 CS master's median ~$90-95K; BLS 15-1252
    "Artificial Intelligence & Data Science":      98000,  // NACE ML/AI grad; Glassdoor DS master's $95-102K
    "Business & Management":                       68000,  // NACE Business master's median $64-72K
    "MBA":                                         90000,  // GMAC 2024: AACSB mid-tier MBA median base ~$88-95K
    "Economics & Finance":                         76000,  // BLS Financial Analysts 13-2051; CFA entry $72-80K
    "Engineering (Mechanical/Civil/Electrical)":   88000,  // NACE Spring 2024: Eng. MS average ~$86-92K
    "Medicine & Public Health":                    66000,  // AAMC MPH/DrPH entry; BLS 29-1221
    "Law":                                         82000,  // NALP JD class 2023 overall employed median
    "Nursing & Allied Health":                     72000,  // BLS RN 29-1141; new grad market 2024 $68-76K
    "Natural Sciences":                            72000,  // BLS Life/Physical Scientists 19-xxxx; MS premium
    "Biotechnology & Life Sciences":               70000,  // BLS Biochemists 19-1021; Biotech MS entry $68-74K
    "Environmental & Sustainability Studies":      66000,  // BLS Environmental Scientists 19-2041; growing field
    "Social Sciences & Humanities":                58000,  // BLS Social Scientists; policy/research roles
    "Arts, Design & Architecture":                 52000,  // BLS Architects 17-1011; Designers 27-1021
    "Media & Communications":                      65000,  // BLS PR/Media 27-3031; digital media premium
    "Agriculture & Veterinary Sciences":           66000,  // BLS Ag Scientists 19-1011; Vet $70K entry
    "Hospitality & Tourism":                       54000,  // BLS Food Svc Managers 11-9051; hotel management
  },
  // UK figures in USD (GBP × 1.27). Base = mid-tier (QS 301-500) UK PGT
  // graduate. Elite university overrides in UNIVERSITY_SALARY_OVERRIDES.
  // Sources: HESA Graduate Outcomes 2022/23; ISE Student Recruitment 2024;
  //   NHS Band 5 2024/25; High Fliers Graduate Market 2024.
  UK: {
    "Computer Science & IT":                       50000,  // £39.4K — HESA CS / Glassdoor Grad SE; revised up
    "Artificial Intelligence & Data Science":      53000,  // £41.7K — Glassdoor Grad DS + MSc AI premium
    "Business & Management":                       42000,  // £33.1K — MSc Business / Management baseline
    "MBA":                                         82000,  // £64.6K — Warwick/Manchester/Bath MBA median 2024
    "Economics & Finance":                         52000,  // £40.9K — MSc Finance; ISE Finance & Prof Services
    "Engineering (Mechanical/Civil/Electrical)":   46000,  // £36.2K — HESA Eng. PGT; Glassdoor grad eng.
    "Medicine & Public Health":                    48000,  // £37.8K — blended MPH/NHS FY1 (£43.9K) adjusted
    "Law":                                         47000,  // £37.0K — blended LLM; City TC via ranking premium
    "Nursing & Allied Health":                     40700,  // £32.0K — NHS Band 5 2024/25 exact
    "Natural Sciences":                            38000,  // £29.9K — HESA physical/natural sciences median
    "Biotechnology & Life Sciences":               40000,  // £31.5K — biomed/biotech MSc entry
    "Environmental & Sustainability Studies":      37000,  // £29.1K — HESA environmental/geography
    "Social Sciences & Humanities":                38000,  // £29.9K — HESA social sciences median
    "Arts, Design & Architecture":                 34000,  // £26.8K — HESA design/architecture
    "Media & Communications":                      36000,  // £28.3K — HESA media/comms median
    "Agriculture & Veterinary Sciences":           35000,  // £27.6K — agriculture/food sector entry
    "Hospitality & Tourism":                       34000,  // £26.8K — hospitality entry level
  },
  // ── Australia ── QILT Graduate Outcomes Survey 2024; ACS IT Salary Survey 2024
  // AUD × 0.65. Base = mid-ranked Australian university PGT graduate.
  Australia: {
    "Computer Science & IT":                       52000,  // ACS 2024: CS grad AUD 80K; SEEK mid-range
    "Artificial Intelligence & Data Science":      58000,  // QILT PGT DS/AI AUD 89K; SEEK AI roles
    "Business & Management":                       47000,  // QILT PGT Business AUD 72K
    "MBA":                                         80000,  // Top AU MBA (Melb, AGSM, MGSM) AUD 123K median
    "Economics & Finance":                         49000,  // Finance analyst entry AUD 75K
    "Engineering (Mechanical/Civil/Electrical)":   57000,  // Engineers Australia 2024: grad AUD 88K median
    "Medicine & Public Health":                    57000,  // QILT Health: MPH/PH AUD 88K
    "Law":                                         51000,  // Legal grad AUD 78K; varies city/firm
    "Nursing & Allied Health":                     47000,  // ANMF RN Band 2 base AUD 72K
    "Natural Sciences":                            46000,  // QILT Science PGT AUD 71K
    "Biotechnology & Life Sciences":               48000,  // Pharma/biotech entry AUD 74K
    "Environmental & Sustainability Studies":      48000,  // QILT Environment AUD 74K
    "Social Sciences & Humanities":                46000,  // QILT Social Sci AUD 71K
    "Arts, Design & Architecture":                 41000,  // Creative arts entry AUD 63K
    "Media & Communications":                      43000,  // Media entry AUD 66K
    "Agriculture & Veterinary Sciences":           47000,  // Ag/Vet entry AUD 72K
    "Hospitality & Tourism":                       44000,  // Hospitality mgt AUD 68K
  },
  // ── Canada ── Canada Job Bank 2024 NOC wages; Glassdoor Canada 2024
  // CAD × 0.73. Base = mid-ranked Canadian university PGT graduate.
  Canada: {
    "Computer Science & IT":                       62000,  // Glassdoor Canada new grad dev CAD 85K; revised up
    "Artificial Intelligence & Data Science":      67000,  // AI/ML Canada CAD 92K; strong talent demand
    "Business & Management":                       40000,  // Business admin entry CAD 55K
    "MBA":                                         73000,  // Rotman/Ivey/Schulich MBA median CAD 100K = $73K
    "Economics & Finance":                         44000,  // Finance analyst NOC 11101 CAD 60K
    "Engineering (Mechanical/Civil/Electrical)":   54000,  // Engineers Canada: new grad CAD 74K
    "Medicine & Public Health":                    52000,  // Public Health Canada: CAD 71K
    "Law":                                         48000,  // Articling associate CAD 66K avg
    "Nursing & Allied Health":                     47000,  // RN Canada entry CAD 64K
    "Natural Sciences":                            41000,  // Natural sciences NOC 21xxx entry CAD 56K
    "Biotechnology & Life Sciences":               45000,  // Pharma/biotech Canada CAD 62K
    "Environmental & Sustainability Studies":      41000,  // Environmental CAD 56K
    "Social Sciences & Humanities":                38000,  // Social worker/researcher CAD 52K
    "Arts, Design & Architecture":                 35000,  // Creative roles CAD 48K
    "Media & Communications":                      36000,  // Media/comms CAD 49K
    "Agriculture & Veterinary Sciences":           38000,  // Ag/Vet Canada CAD 52K
    "Hospitality & Tourism":                       35000,  // Hospitality mgt CAD 48K
  },
  // ── Germany ── Stepstone Gehaltsreport 2024; Bundesagentur für Arbeit Entgeltatlas
  // EUR × 1.08. Base = mid-ranked German/European university PGT graduate.
  Germany: {
    "Computer Science & IT":                       57000,  // Stepstone 2024: IT/Informatiker median EUR 53K = $57K
    "Artificial Intelligence & Data Science":      61000,  // AI/ML Germany EUR 56K; hot market $61K
    "Business & Management":                       46000,  // BWL/Management entry EUR 43K
    "MBA":                                         68000,  // German MBA (Mannheim/WHU/ESMT) EUR 63K avg = $68K
    "Economics & Finance":                         46000,  // Finance/Economics entry EUR 43K
    "Engineering (Mechanical/Civil/Electrical)":   55000,  // Engineering entry EUR 51K; Stepstone Ingenieur
    "Medicine & Public Health":                    62000,  // Assistenzarzt entry EUR 57K = $62K
    "Law":                                         54000,  // Rechtsanwalt entry EUR 50K
    "Nursing & Allied Health":                     39000,  // Krankenschwester entry EUR 36K
    "Natural Sciences":                            46000,  // Natural sciences MSc entry EUR 43K
    "Biotechnology & Life Sciences":               50000,  // Pharma/biotech Germany EUR 46K
    "Environmental & Sustainability Studies":      46000,  // Environmental eng/science EUR 43K
    "Social Sciences & Humanities":                42000,  // Social sci/Sozialwiss EUR 39K
    "Arts, Design & Architecture":                 38000,  // Design/Architektur entry EUR 35K
    "Media & Communications":                      39000,  // Media/Komm EUR 36K
    "Agriculture & Veterinary Sciences":           40000,  // Agrar/Vet EUR 37K
    "Hospitality & Tourism":                       38000,  // Hospitality entry EUR 35K
  },
  // ── Singapore ── MOE/MOM Graduate Employment Survey 2023 (moe.gov.sg)
  // SGD × 0.74. Base calibrated to mid-tier SG institution (NOT NUS/NTU/SMU
  // level — those are handled via UNIVERSITY_SALARY_OVERRIDES for accuracy).
  Singapore: {
    "Computer Science & IT":                       44000,  // Mid-tier SG tech entry SGD 5,000/month × 12 × 0.74
    "Artificial Intelligence & Data Science":      48000,  // AI/DS mid-tier SG SGD 5,400/month
    "Business & Management":                       37000,  // Business mid-tier SG SGD 4,200/month
    "MBA":                                         55000,  // Mid-tier SG MBA SGD 6,200/month
    "Economics & Finance":                         38000,  // Economics entry SGD 4,300/month
    "Engineering (Mechanical/Civil/Electrical)":   38000,  // Engineering entry SGD 4,300/month
    "Medicine & Public Health":                    40000,  // Public health officer SG entry
    "Law":                                         62000,  // Singapore law associate SGD 7,000+/month
    "Nursing & Allied Health":                     35000,  // MOE Nursing SGD 4,000/month
    "Natural Sciences":                            34000,  // MOE Science SGD 3,800/month
    "Biotechnology & Life Sciences":               34000,  // MOE Life Sciences SGD 3,800/month
    "Environmental & Sustainability Studies":      34000,  // Environmental roles SGD 3,800/month
    "Social Sciences & Humanities":                34000,  // MOE Arts/SS SGD 3,850/month
    "Arts, Design & Architecture":                 31000,  // Design/Architecture entry
    "Media & Communications":                      31000,  // Media entry
    "Agriculture & Veterinary Sciences":           33000,  // Agri-food/vet entry
    "Hospitality & Tourism":                       30000,  // Hospitality entry SGD 3,400/month
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

// ─── University-specific salary overrides ────────────────────────────────────
//
// These override the base-salary × ranking-premium formula for named elite
// institutions where employment report data is available. Values represent
// MEDIAN starting base salary (USD) for the stated field.
//
// Sources:
//  MBA schools   — school-published Employment Reports 2024 (median base)
//  Law schools   — NALP school-level data 2023; BigLaw market rate $225K/year
//  CS/Eng/AI     — Levels.fyi, LinkedIn Salary Insights, school career reports
//  Australia     — MGSM, AGSM, UMelb published employment outcomes 2024
//  Canada        — Rotman, Ivey, Schulich graduate employment reports 2024
//  Europe        — FT MBA Rankings & school salary disclosures 2024
//
export const UNIVERSITY_SALARY_OVERRIDES: Partial<Record<string, Partial<Record<FieldOfStudy, number>>>> = {

  // ── USA: Ivy League & elite research universities ─────────────────────────
  "Harvard University": {
    "MBA":                                       175000,  // HBS Employment Report 2024: median base $175K
    "Law":                                       215000,  // HLS 2023: ~54% BigLaw placement; weighted median
    "Computer Science & IT":                     148000,  // SEAS/EECS undergrad → FAANG; Levels.fyi $145-152K
  },
  "Stanford University": {
    "MBA":                                       182000,  // GSB 2024 Employment Report: median base $177K + signing
    "Artificial Intelligence & Data Science":    162000,  // Stanford AI MS → FAANG/OpenAI/Google DeepMind
    "Computer Science & IT":                     158000,  // Stanford CS → top-tier tech; Levels.fyi
  },
  "Massachusetts Institute of Technology": {
    "Computer Science & IT":                     158000,  // MIT EECS MS → FAANG; Levels.fyi median base
    "Artificial Intelligence & Data Science":    162000,  // MIT AI/ML → AI labs; OpenAI/Google/Meta
    "Engineering (Mechanical/Civil/Electrical)": 115000,  // MIT AeroAstro/Mech Eng → defense/aerospace
    "Natural Sciences":                           96000,  // MIT hard sciences MS/PhD → biotech/research/finance
  },
  "Carnegie Mellon University": {
    "Artificial Intelligence & Data Science":    148000,  // CMU ML MSc → AI companies; median base ~$145-152K
    "Computer Science & IT":                     145000,  // CMU MSCS/MCSD → top-tier tech
  },
  "University of Pennsylvania": {
    "MBA":                                       175000,  // Wharton 2024 Employment Report: median base $175K
    "Computer Science & IT":                     152000,  // Penn SEAS CS UG → FAANG; Levels.fyi
  },
  "Northwestern University": {
    "MBA":                                       168000,  // Kellogg 2024: median base $165K; consulting/finance
  },
  "Columbia University": {
    "MBA":                                       160000,  // CBS 2024: median base $160K; IB/consulting
  },
  "NYU Stern School of Business": {
    "MBA":                                       152000,  // Stern 2024: median base $150K; NYC finance
  },
  "Duke University": {
    "MBA":                                       152000,  // Fuqua 2024: median base ~$150-155K
  },
  "Rice University": {
    "MBA":                                       142000,  // Jones School 2024: median ~$140-145K; energy/finance
  },
  "Cornell University": {
    "Computer Science & IT":                     148000,  // Cornell MEng CS → Google/Amazon/Meta
    "Hospitality & Tourism":                      76000,  // Cornell SHA: Marriott/Hilton corporate $72-82K
  },
  "Yale University": {
    "Law":                                       228000,  // YLS 2023: ~70% large firms BigLaw; weighted median
    "Economics & Finance":                       125000,  // Yale Econ BA → finance/consulting
  },
  "Princeton University": {
    "Computer Science & IT":                     152000,  // Princeton BSE CS → FAANG; Levels.fyi
    "Engineering (Mechanical/Civil/Electrical)": 118000,  // Princeton EE → finance/defense/tech
  },
  "Johns Hopkins University": {
    "Natural Sciences":                           86000,  // JHU Applied Math/Stats → finance/healthcare analytics
    "Medicine & Public Health":                   84000,  // JHU MPH → healthcare/CDC/NIH $80-90K
  },
  "Georgetown University": {
    "Social Sciences & Humanities":              84000,   // Georgetown MSFS → State Dept/consulting/think tanks
  },
  "Georgia Institute of Technology": {
    "Engineering (Mechanical/Civil/Electrical)": 96000,   // Georgia Tech Ind/Mech Eng → top manufacturers
  },
  "University of Illinois Urbana-Champaign": {
    "Computer Science & IT":                     135000,  // UIUC CS UG → FAANG; strong tech placement
  },
  "University of California, Berkeley": {
    "Engineering (Mechanical/Civil/Electrical)": 112000,  // Berkeley MEng EECS → top-tier tech/semiconductor
    "Computer Science & IT":                     148000,  // Berkeley CS → FAANG
  },
  "UCLA": {
    "Computer Science & IT":                     148000,  // UCLA MSCS → Netflix/Snap/Amazon/LA tech
    "Media & Communications":                     74000,  // UCLA Film/TV → entertainment industry
  },
  "UC San Diego": {
    "Computer Science & IT":                     142000,  // UCSD MSCS → Qualcomm/biotech/FAANG
  },
  "California Institute of Technology": {
    "Engineering (Mechanical/Civil/Electrical)": 125000,  // Caltech AeroAstro/Mech → JPL/SpaceX/Boeing
  },

  // ── UK: Russell Group & specialist schools ───────────────────────────────
  "University of Oxford": {
    "Computer Science & IT":                      92000,  // Oxford MSc CS → London tech/finance; £72K
    "MBA":                                        105000,  // Oxford Saïd MBA 2024: median £83K = $105K
  },
  "University of Cambridge": {
    "Computer Science & IT":                      93000,  // Cambridge MPhil ACS → ARM/DeepMind/McKinsey; £73K
    "Natural Sciences":                            80000,  // Cambridge NatSci → pharma/finance/research; £63K
  },
  "London School of Economics": {
    "Economics & Finance":                         90000,  // LSE MSc Finance/Econ → City; £71K median 2024
    "Law":                                         94000,  // LSE LLM → Magic Circle/US firms; £74K
  },
  "Imperial College London": {
    "Artificial Intelligence & Data Science":      96000,  // Imperial MSc AI → London tech/finance; £76K
    "Engineering (Mechanical/Civil/Electrical)":   80000,  // Imperial Eng → top engineering firms; £63K
  },
  "University College London": {
    "Artificial Intelligence & Data Science":      90000,  // UCL MSc DS → London tech; £71K
    "Computer Science & IT":                       86000,  // UCL CS → London tech; £68K
  },

  // ── France: Grande École programs ────────────────────────────────────────
  "HEC Paris": {
    "MBA":                                        126000,  // HEC Paris MBA 2024: median EUR 117K = $126K
    "Business & Management":                       86000,  // HEC Grande École MSc Mgmt → consulting; EUR 80K
  },
  "INSEAD": {
    "MBA":                                        132000,  // INSEAD MBA 2024: median EUR 122K = $132K
  },

  // ── Singapore: Top institutions (base is calibrated below NUS/NTU level) ─
  "National University of Singapore": {
    "Computer Science & IT":                      58000,  // NUS CS MSc: SGD 6,700/month = $59K; MOE GES 2023
    "Artificial Intelligence & Data Science":      62000,  // NUS AI/CS MSc: SGD 7,000-7,500/month
    "Economics & Finance":                         52000,  // NUS Finance/Econ: SGD 5,800/month
    "Business & Management":                       50000,  // NUS Business: SGD 5,600/month
    "MBA":                                         72000,  // NUS MBA: SGD 8,200+/month → $73K
    "Engineering (Mechanical/Civil/Electrical)":   50000,  // NUS Eng: SGD 5,600/month
  },
  "Nanyang Technological University": {
    "Artificial Intelligence & Data Science":      62000,  // NTU MSc AI: SGD 7,200-8,000/month
    "Computer Science & IT":                       58000,  // NTU CS: SGD 6,500-7,000/month
    "Engineering (Mechanical/Civil/Electrical)":   50000,  // NTU Eng: SGD 5,600/month
    "Business & Management":                       49000,  // NTU Business: SGD 5,500/month
  },
  "Singapore Management University": {
    "MBA":                                         68000,  // SMU MBA: SGD 7,700/month → $68K
  },
  "INSEAD Asia Campus": {
    "MBA":                                        132000,  // Same INSEAD accreditation; EUR 122K median
  },

  // ── Germany: Research-intensive universities ──────────────────────────────
  "Technical University of Munich": {
    "Computer Science & IT":                       72000,  // TUM Informatics → Munich/Berlin tech; EUR 67K = $72K
    "Artificial Intelligence & Data Science":      76000,  // TUM AI/ML → SAP/BMW/Siemens AI; EUR 70K = $76K
    "Engineering (Mechanical/Civil/Electrical)":   64000,  // TUM Mech/Aero Eng → BMW/Siemens; EUR 59K = $64K
  },

  // ── Australia: Group of Eight ────────────────────────────────────────────
  "University of Melbourne": {
    "Artificial Intelligence & Data Science":      70000,  // UMelb Data Science Masters: AUD 108K = $70K
    "Computer Science & IT":                       66000,  // UMelb CS Masters: AUD 102K = $66K
  },
  "University of Sydney": {
    "MBA":                                         84000,  // USyd MBA 2024: AUD 129K median = $84K
    "Computer Science & IT":                       66000,  // USyd Advanced Computing: AUD 102K = $66K
  },
  "University of New South Wales": {
    "Engineering (Mechanical/Civil/Electrical)":   67000,  // UNSW Eng: AUD 103K = $67K
    "Business & Management":                       62000,  // UNSW Business: AUD 95K = $62K
  },
  "University of Queensland": {
    "Business & Management":                       58000,  // UQ Business: AUD 89K = $58K
  },
  "Monash University": {
    "Artificial Intelligence & Data Science":      62000,  // Monash AI Eng: AUD 95K = $62K
    "Engineering (Mechanical/Civil/Electrical)":   60000,  // Monash Eng: AUD 92K = $60K
  },

  // ── Canada: Top institutions ──────────────────────────────────────────────
  "University of Toronto": {
    "Computer Science & IT":                       76000,  // UofT MScAC → tech/FAANG Canada; CAD 104K = $76K
    "Artificial Intelligence & Data Science":      80000,  // UofT AI → Vector Institute; CAD 110K = $80K
  },
  "University of British Columbia": {
    "Computer Science & IT":                       72000,  // UBC CS MSc → Vancouver/Seattle; CAD 99K = $72K
    "Artificial Intelligence & Data Science":      76000,  // UBC AI/ML → tech sector; CAD 104K = $76K
  },
  "McGill University": {
    "Engineering (Mechanical/Civil/Electrical)":   66000,  // McGill Eng → Montreal aerospace/pharma; CAD 90K = $66K
    "Natural Sciences":                            55000,  // McGill Science → pharma/research; CAD 75K = $55K
  },

  // ── Ireland: Tech hub institutions ───────────────────────────────────────
  "Trinity College Dublin": {
    "Computer Science & IT":                       58000,  // TCD CS → Dublin tech firms (Google/Meta/Amazon); EUR 54K
    "Artificial Intelligence & Data Science":      60000,  // TCD AI → MNCs in Dublin; EUR 56K
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
